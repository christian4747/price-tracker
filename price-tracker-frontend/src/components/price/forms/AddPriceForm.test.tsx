import { describe, expect, onTestFinished, vi } from 'vitest'
import type { SetupWorker } from 'msw/browser'
import { createPeriod, createProduct, renderWithClient, screen, test, userEvent, waitFor } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import type { PeriodType } from '@/types/period'
import { AddPriceForm } from './AddPriceForm'

const product = createProduct(1)

const pricesApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/prices'
const periodsApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/periods'

const dateButtons = ['Start Date Only', 'Start and End Date', 'Sale Period']

const savedPrice = { priceStarted: new Date(2026, 8, 4, 12).toISOString() }

// Built from local times so the expected text doesn't depend on the test machine's time zone
const blackFriday = {
    priceStarted: new Date(2026, 10, 27, 0, 0).toISOString(),
    priceEnded: new Date(2026, 10, 30, 23, 59).toISOString()
}
const blackFridayLabel = 'Nov 27, 2026 12:00 AM to Nov 30, 2026 11:59 PM'

// A named sale period with the same dates as blackFriday
const namedBlackFriday = createPeriod(1, {
    name: 'Black Friday',
    periodStarted: blackFriday.priceStarted,
    periodEnded: blackFriday.priceEnded
})
const namedBlackFridayLabel = 'Black Friday, ' + blackFridayLabel

// Serves the given periods for the product's store, and records the store each request asks for
const servePeriods = (worker: SetupWorker, periods: PeriodType[]) => {
    const requestedStores: (string | null)[] = []
    worker.use(
        http.get(periodsApiUrl, ({ request }) => {
            requestedStores.push(new URL(request.url).searchParams.get('store'))
            return HttpResponse.json(periods)
        })
    )
    return requestedStores
}

// Serves recent price data with no recent values, apart from the given changes
const serveRecentPriceData = (worker: SetupWorker, changes: object = {}) => {
    worker.use(
        http.get(pricesApiUrl + '/recent/:productId', () =>
            HttpResponse.json({
                baseAmounts: [],
                currencies: [],
                descriptions: [],
                discountPercentages: [],
                pricesEnded: [],
                pricesStarted: [],
                returnPercentages: [],
                pricePeriods: [],
                ...changes
            })
        )
    )
}

// Records the start and end dates of each range the form saves, as times so time zone offsets don't matter
const recordSavedRanges = (worker: SetupWorker) => {
    const savedRanges: { priceStarted: number; priceEnded: number }[] = []
    worker.use(
        http.post(pricesApiUrl + '/range', async ({ request }) => {
            const body = (await request.json()) as { priceStarted: string; priceEnded: string }
            savedRanges.push({ priceStarted: Date.parse(body.priceStarted), priceEnded: Date.parse(body.priceEnded) })
            return HttpResponse.json([savedPrice, savedPrice])
        })
    )
    return savedRanges
}

// Renders the form and starts a save that stays in progress until finishSave is called
const startSave = async (worker: SetupWorker, dateButton: string) => {
    let finishSave = () => {}
    const saveFinished = new Promise<void>((resolve) => (finishSave = resolve))
    // Tests that end mid-save still let the request finish
    onTestFinished(() => finishSave())
    worker.use(
        http.post(pricesApiUrl, async () => {
            await saveFinished
            return HttpResponse.json(savedPrice)
        }),
        http.post(pricesApiUrl + '/range', async () => {
            await saveFinished
            return HttpResponse.json([savedPrice, savedPrice])
        })
    )
    const close = vi.fn()
    const setDateToday = vi.fn()
    const user = userEvent.setup()
    renderWithClient(<AddPriceForm product={product} setDateToday={setDateToday} close={close} />)

    await user.click(screen.getByRole('button', { name: dateButton }))
    const submitButton = screen.getByRole('button', { name: 'Add Price' })
    await user.click(submitButton)
    await waitFor(() => expect(submitButton).toBeDisabled())

    return { close, setDateToday, finishSave, submitButton }
}

describe('Add Price Form Component', () => {
    test('should prefill quick add with the most recent price and its derived amounts', async ({ worker }) => {
        worker.use(
            http.get(pricesApiUrl + '/recent/:productId', () =>
                HttpResponse.json({
                    baseAmounts: [100],
                    currencies: ['USD'],
                    descriptions: [],
                    discountPercentages: [0.2],
                    pricesEnded: [],
                    pricesStarted: [],
                    returnPercentages: [0.05]
                })
            )
        )
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} quickAdd />)

        const discountAmountInput = screen.getByRole('textbox', { name: /discount amount/i }) as HTMLInputElement
        const returnAmountInput = screen.getByRole('textbox', { name: /return amount/i }) as HTMLInputElement
        await waitFor(() => {
            expect(discountAmountInput.value).toBe('80.00')
            expect(returnAmountInput.value).toBe('4.00')
        })
    })

    test('should block adding a price that ends before it starts', async ({ worker }) => {
        worker.use(
            http.get(pricesApiUrl + '/recent/:productId', () =>
                HttpResponse.json({
                    baseAmounts: [100],
                    currencies: ['USD'],
                    descriptions: [],
                    discountPercentages: [0],
                    pricesEnded: [new Date(2026, 8, 5, 12).toISOString()],
                    pricesStarted: [new Date(2026, 8, 10, 12).toISOString()],
                    returnPercentages: [0]
                })
            )
        )
        const user = userEvent.setup()
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} quickAdd />)

        const addButton = screen.getByRole('button', { name: 'Add Price' })
        await user.click(screen.getByRole('button', { name: 'Start and End Date' }))

        await waitFor(() => expect(screen.getByText('End date must be after the start date')).toBeInTheDocument())
        expect(addButton).toBeDisabled()

        // The end date is ignored when only adding a start date
        await user.click(screen.getByRole('button', { name: 'Start Date Only' }))
        expect(screen.queryByText('End date must be after the start date')).not.toBeInTheDocument()
        expect(addButton).toBeEnabled()
    })

    test('should show recent dates with a 12-hour time', async ({ worker }) => {
        worker.use(
            http.get(pricesApiUrl + '/recent/:productId', () =>
                HttpResponse.json({
                    baseAmounts: [],
                    currencies: [],
                    descriptions: [],
                    discountPercentages: [],
                    // Built from local times so the expected text doesn't depend on the test machine's time zone
                    pricesEnded: [new Date(2026, 8, 10, 23, 59).toISOString()],
                    pricesStarted: [new Date(2026, 8, 4, 14, 5).toISOString()],
                    returnPercentages: []
                })
            )
        )
        const user = userEvent.setup()
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} />)

        await user.click(screen.getByRole('button', { name: 'Start and End Date' }))

        await expect.element(await screen.findByRole('button', { name: 'Sep 4, 2026 2:05 PM' })).toBeVisible()
        await expect.element(screen.getByRole('button', { name: 'Sep 10, 2026 11:59 PM' })).toBeVisible()
    })

    test('should show recent periods with a 12-hour time for a sale period', async ({ worker }) => {
        serveRecentPriceData(worker, { pricePeriods: [blackFriday] })
        const user = userEvent.setup()
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} />)

        await user.click(screen.getByRole('button', { name: 'Sale Period' }))

        await expect.element(await screen.findByRole('button', { name: blackFridayLabel })).toBeVisible()
    })

    test('should only show recent periods for a sale period', async ({ worker }) => {
        serveRecentPriceData(worker, { pricePeriods: [blackFriday] })
        const user = userEvent.setup()
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} />)

        // Shown first, so a missing button afterwards means it's hidden rather than still loading
        await user.click(screen.getByRole('button', { name: 'Sale Period' }))
        await screen.findByRole('button', { name: blackFridayLabel })
        await user.click(screen.getByRole('button', { name: 'Start and End Date' }))

        expect(screen.queryByRole('button', { name: blackFridayLabel })).not.toBeInTheDocument()
    })

    test('should save both dates of a recent period as a range', async ({ worker }) => {
        serveRecentPriceData(worker, { pricePeriods: [blackFriday] })
        const savedRanges = recordSavedRanges(worker)
        const user = userEvent.setup()
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} />)

        await user.click(screen.getByRole('button', { name: 'Sale Period' }))
        await user.click(await screen.findByRole('button', { name: blackFridayLabel }))
        await user.click(screen.getByRole('button', { name: 'Add Price' }))

        await waitFor(() =>
            expect(savedRanges).toEqual([
                { priceStarted: Date.parse(blackFriday.priceStarted), priceEnded: Date.parse(blackFriday.priceEnded) }
            ])
        )
    })

    test('should let a date be changed after choosing a recent period', async ({ worker }) => {
        const laterEnd = new Date(2026, 11, 1, 23, 59).toISOString()
        serveRecentPriceData(worker, { pricePeriods: [blackFriday], pricesEnded: [laterEnd] })
        const savedRanges = recordSavedRanges(worker)
        const user = userEvent.setup()
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} />)

        await user.click(screen.getByRole('button', { name: 'Sale Period' }))
        await user.click(await screen.findByRole('button', { name: blackFridayLabel }))
        await user.click(screen.getByRole('button', { name: 'Dec 1, 2026 11:59 PM' }))
        await user.click(screen.getByRole('button', { name: 'Add Price' }))

        await waitFor(() =>
            expect(savedRanges).toEqual([
                { priceStarted: Date.parse(blackFriday.priceStarted), priceEnded: Date.parse(laterEnd) }
            ])
        )
    })

    test('should show named sale periods with their dates for a sale period', async ({ worker }) => {
        servePeriods(worker, [namedBlackFriday])
        const user = userEvent.setup()
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} />)

        await user.click(screen.getByRole('button', { name: 'Sale Period' }))

        await expect.element(await screen.findByRole('button', { name: namedBlackFridayLabel })).toBeVisible()
    })

    test("should ask for the periods of the product's store", async ({ worker }) => {
        const requestedStores = servePeriods(worker, [])
        const user = userEvent.setup()
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} />)

        await user.click(screen.getByRole('button', { name: 'Sale Period' }))

        await waitFor(() => expect(requestedStores).toContain(product.store))
        expect(requestedStores.every((store) => store === product.store)).toBe(true)
    })

    test('should leave out return periods', async ({ worker }) => {
        servePeriods(worker, [namedBlackFriday, createPeriod(2, { name: 'Card cashback', type: 'RETURN' })])
        const user = userEvent.setup()
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} />)

        // Shown first, so a missing button afterwards means it's left out rather than still loading
        await user.click(screen.getByRole('button', { name: 'Sale Period' }))
        await screen.findByRole('button', { name: namedBlackFridayLabel })

        expect(screen.queryByRole('button', { name: /Card cashback/ })).not.toBeInTheDocument()
    })

    test('should show named periods above recent periods', async ({ worker }) => {
        servePeriods(worker, [namedBlackFriday])
        serveRecentPriceData(worker, { pricePeriods: [blackFriday] })
        const user = userEvent.setup()
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} />)

        await user.click(screen.getByRole('button', { name: 'Sale Period' }))
        const namedButton = await screen.findByRole('button', { name: namedBlackFridayLabel })
        const recentButton = await screen.findByRole('button', { name: blackFridayLabel })

        expect(namedButton.compareDocumentPosition(recentButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    test('should save both dates of a named period as a range', async ({ worker }) => {
        servePeriods(worker, [namedBlackFriday])
        const savedRanges = recordSavedRanges(worker)
        const user = userEvent.setup()
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} />)

        await user.click(screen.getByRole('button', { name: 'Sale Period' }))
        await user.click(await screen.findByRole('button', { name: namedBlackFridayLabel }))
        await user.click(screen.getByRole('button', { name: 'Add Price' }))

        await waitFor(() =>
            expect(savedRanges).toEqual([
                { priceStarted: Date.parse(blackFriday.priceStarted), priceEnded: Date.parse(blackFriday.priceEnded) }
            ])
        )
    })

    test('should explain when there are no sale periods', async ({ worker }) => {
        serveRecentPriceData(worker)
        servePeriods(worker, [])
        const user = userEvent.setup()
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} />)

        await user.click(screen.getByRole('button', { name: 'Sale Period' }))

        await expect.element(await screen.findByText('No sale periods yet. Enter the dates below.')).toBeVisible()
    })

    test('should not explain when there are only named periods', async ({ worker }) => {
        serveRecentPriceData(worker)
        servePeriods(worker, [namedBlackFriday])
        const user = userEvent.setup()
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} />)

        await user.click(screen.getByRole('button', { name: 'Sale Period' }))
        await screen.findByRole('button', { name: namedBlackFridayLabel })

        expect(screen.queryByText('No sale periods yet. Enter the dates below.')).not.toBeInTheDocument()
    })

    test('should default to a valid end date', async () => {
        const user = userEvent.setup()
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} />)

        await user.click(screen.getByRole('button', { name: 'Start and End Date' }))

        expect(screen.queryByText('End date must be after the start date')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Add Price' })).toBeEnabled()
    })

    test.for(dateButtons)('should show the save in progress with %s', async (dateButton, { worker }) => {
        const { submitButton } = await startSave(worker, dateButton)

        expect(submitButton).toHaveAttribute('data-loading')
    })

    test.for(dateButtons)('should not close before the save ends with %s', async (dateButton, { worker }) => {
        const { close, setDateToday } = await startSave(worker, dateButton)

        expect(close).not.toHaveBeenCalled()
        expect(setDateToday).not.toHaveBeenCalled()
    })

    test.for(dateButtons)('should close once the save succeeds with %s', async (dateButton, { worker }) => {
        const { close, setDateToday, finishSave } = await startSave(worker, dateButton)

        finishSave()

        await waitFor(() => expect(close).toHaveBeenCalledOnce())
        expect(setDateToday).toHaveBeenCalledOnce()
    })

    test.for(dateButtons)('should stay open with its values when rejected with %s', async (dateButton, { worker }) => {
        let saveRejected = false
        const rejectSave = () => {
            saveRejected = true
            return HttpResponse.text('Price is invalid', { status: 400 })
        }
        worker.use(http.post(pricesApiUrl, rejectSave), http.post(pricesApiUrl + '/range', rejectSave))
        const close = vi.fn()
        const user = userEvent.setup()
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={close} />)

        await user.click(screen.getByRole('button', { name: dateButton }))
        await user.type(screen.getByRole('textbox', { name: 'Description' }), 'Sale')
        const submitButton = screen.getByRole('button', { name: 'Add Price' })
        await user.click(submitButton)

        await waitFor(() => expect(saveRejected).toBe(true))
        await waitFor(() => expect(submitButton).toBeEnabled())
        expect(close).not.toHaveBeenCalled()
        expect((screen.getByRole('textbox', { name: 'Description' }) as HTMLInputElement).value).toBe('Sale')
    })

    test('should render input for price', async () => {
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} />)

        const discountAmountInput = screen.getByText('Base Price', { selector: 'label' })
        await expect.element(discountAmountInput).toBeInTheDocument()
    })

    test('should render input for discount amount', async () => {
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} />)

        const discountAmountInput = screen.getByText('Discount Amount', { selector: 'label' })
        await expect.element(discountAmountInput).toBeInTheDocument()
    })

    test('should render input for discount percentage', async () => {
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} />)

        const discountPercentLabel = screen.getByText('Discount %', { selector: 'label' })
        await expect.element(discountPercentLabel).toBeInTheDocument()
    })

    test('should render input for return percentage', async () => {
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} />)

        const returnPercentageLabel = screen.getByText('Return %', { selector: 'label' })
        await expect.element(returnPercentageLabel).toBeInTheDocument()
    })
})
