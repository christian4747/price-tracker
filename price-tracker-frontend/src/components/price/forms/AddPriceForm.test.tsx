import { describe, expect, onTestFinished, vi } from 'vitest'
import type { SetupWorker } from 'msw/browser'
import { renderWithClient, screen, test, userEvent, waitFor } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import { AddPriceForm } from './AddPriceForm'
import type { ProductType } from '@/types/product'

const product: ProductType = {
    active: false,
    productId: 0,
    name: '',
    link: '',
    store: '',
    createdAt: '',
    updatedAt: '',
    prices: [],
    deletedAt: null
}

const pricesApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/prices'

const dateButtons = ['Start Date Only', 'Start and End Date']

const savedPrice = { priceStarted: '2026-09-04T00:00:00.000Z' }

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
                    pricesEnded: ['2026-09-05T12:00:00.000Z'],
                    pricesStarted: ['2026-09-10T12:00:00.000Z'],
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
