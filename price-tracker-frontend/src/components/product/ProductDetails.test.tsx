import { afterEach, beforeEach, describe, expect, onTestFinished } from 'vitest'
import { page } from 'vitest/browser'
import {
    cleanup,
    createPrice,
    createProduct,
    createProductBody,
    renderWithClient,
    screen,
    test,
    userEvent,
    within
} from '@/test-utils'
import { http, HttpResponse } from 'msw'
import type { SetupWorker } from 'msw/browser'
import type { PriceType } from '@/types/price'
import { ProductDetails } from './ProductDetails'
import '@/styles/index.css'

const pricesApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/prices'

const productBody = createProductBody(createProduct(1))

// Built from local times so the expected text doesn't depend on the test machine's time zone
const livePrice = createPrice(1, { priceStarted: new Date(2026, 8, 4, 12).toISOString() })
const deletedPrice = createPrice(2, {
    priceStarted: new Date(2026, 8, 5, 12).toISOString(),
    deletedAt: new Date(2026, 8, 6, 12).toISOString()
})

// One price a day from Sep 1, 2026, so each row has its own date to find
const createDailyPrices = (count: number) =>
    Array.from({ length: count }, (_, index) =>
        createPrice(index + 1, { priceStarted: new Date(2026, 8, index + 1, 12).toISOString() })
    )

// Renders the details at a desktop width
const renderDetails = (children?: React.ReactNode) =>
    renderWithClient(
        <div data-testid="details-width" style={{ width: 1000 }}>
            <ProductDetails productBody={productBody} dateToday={new Date()} setDateToday={() => {}}>
                {children}
            </ProductDetails>
        </div>
    )

// The panel is replaced once the prices load, so look it up again for each measurement
const getPanel = () => screen.getByTestId('details-width').firstElementChild as HTMLElement

// Renders the details with the given prices and waits for the first one to show. Returns the whole panel and the
// scrolling list that holds the price rows.
const renderDetailsWithPrices = async (
    worker: SetupWorker,
    prices: PriceType[],
    children?: React.ReactNode,
    firstDate = 'Sep 1, 2026'
) => {
    worker.use(http.get(pricesApiUrl + '/product/:productId', () => HttpResponse.json(prices)))
    renderDetails(children)

    // Looked for in the list, since the chart's axis can show the same date
    const priceList = await screen.findByRole('list', { name: 'Prices' })
    await within(priceList).findByText(firstDate)
    return { panel: getPanel(), priceList }
}

// The number of lines the element's text takes up on screen
const countLines = (element: HTMLElement) => {
    const range = document.createRange()
    range.selectNodeContents(element)
    return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size
}

// Whether the given part of the element's text, such as "12:45 PM", shows on a single line
const staysOnOneLine = (element: HTMLElement, part: string) => {
    const text = element.firstChild!
    const start = text.textContent!.replace(/\s/g, ' ').indexOf(part)
    const range = document.createRange()
    range.setStart(text, start)
    range.setEnd(text, start + part.length)
    return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size === 1
}

// Fails the first price request, then answers later ones with the live price
const failFirstPriceRequest = () => {
    let requestCount = 0
    return http.get(pricesApiUrl + '/product/:productId', () => {
        requestCount++
        return requestCount === 1
            ? HttpResponse.json({ message: 'Server error' }, { status: 500 })
            : HttpResponse.json([livePrice])
    })
}

describe('Product Details Component', () => {
    test('should render product prices', async () => {
        renderWithClient(<ProductDetails productBody={productBody} dateToday={new Date()} setDateToday={() => {}} />)

        const price1Date = await screen.findByText('Sep 4, 2026')
        await expect.element(price1Date).toBeInTheDocument()

        const price2Date = await screen.findByText('Sep 5, 2026')
        await expect.element(price2Date).toBeInTheDocument()
    })

    test('should still list deleted prices when they are shown', async ({ worker }) => {
        worker.use(
            http.get(pricesApiUrl + '/product/:productId', ({ request }) => {
                const showDeleted = new URL(request.url).searchParams.get('showDeleted') === 'true'
                return HttpResponse.json(showDeleted ? [livePrice, deletedPrice] : [livePrice])
            })
        )
        const user = userEvent.setup()
        renderWithClient(<ProductDetails productBody={productBody} dateToday={new Date()} setDateToday={() => {}} />)

        await screen.findByText('Sep 4, 2026')
        expect(screen.queryByText('Sep 5, 2026')).not.toBeInTheDocument()

        await user.click(screen.getByRole('checkbox', { name: 'Show deleted prices' }))

        await expect.element(await screen.findByText('Sep 5, 2026')).toBeInTheDocument()
    })

    test('should show a message with a retry button when the prices fail to load', async ({ worker }) => {
        worker.use(failFirstPriceRequest())
        renderWithClient(<ProductDetails productBody={productBody} dateToday={new Date()} setDateToday={() => {}} />)

        await expect.element(await screen.findByText("Couldn't load prices")).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    })

    test('should show the prices once a retry succeeds', async ({ worker }) => {
        worker.use(failFirstPriceRequest())
        const user = userEvent.setup()
        renderWithClient(<ProductDetails productBody={productBody} dateToday={new Date()} setDateToday={() => {}} />)

        await user.click(await screen.findByRole('button', { name: 'Retry' }))

        await expect.element(await screen.findByText('Sep 4, 2026')).toBeInTheDocument()
        expect(screen.queryByText("Couldn't load prices")).not.toBeInTheDocument()
    })
})

describe('Product Details Time Range', () => {
    // Noon in local time, so each range starts at a local midnight that doesn't depend on the test machine's time
    // zone. A fixed day, so the ranges are known to count back from dateToday rather than the real date.
    const dateToday = new Date(2026, 9, 15, 12)
    const oneYearStart = new Date(2025, 9, 15).toISOString()
    const twoYearsStart = new Date(2024, 9, 15).toISOString()

    // Each range answers with one more, older price, so the rows show which range was asked for
    const recentPrice = createPrice(1, { priceStarted: new Date(2026, 8, 1, 12).toISOString() })
    const olderPrice = createPrice(2, { priceStarted: new Date(2025, 2, 1, 12).toISOString() })
    const oldestPrice = createPrice(3, { priceStarted: new Date(2023, 0, 1, 12).toISOString() })
    const pricesByStartDate = new Map<string | null, PriceType[]>([
        [oneYearStart, [recentPrice]],
        [twoYearsStart, [recentPrice, olderPrice]],
        [null, [recentPrice, olderPrice, oldestPrice]]
    ])

    // Answers price requests by their start date and keeps each request's query parameters
    const answerByStartDate = (worker: SetupWorker) => {
        const requests: URLSearchParams[] = []
        worker.use(
            http.get(pricesApiUrl + '/product/:productId', ({ request }) => {
                const params = new URL(request.url).searchParams
                requests.push(params)
                return HttpResponse.json(pricesByStartDate.get(params.get('startDate')) ?? [])
            })
        )
        return requests
    }

    // The details of the product with the given ID, on the fixed dateToday, ready to render
    const detailsForProduct = (productId: number = 1) => (
        <ProductDetails
            productBody={createProductBody(createProduct(productId))}
            dateToday={dateToday}
            setDateToday={() => {}}
        />
    )

    test('should open on 1 year and ask for prices from midnight a year ago', async ({ worker }) => {
        const requests = answerByStartDate(worker)
        renderWithClient(detailsForProduct())

        await screen.findByText('Sep 1, 2026')

        expect(screen.getByRole('radio', { name: '1 year' })).toBeChecked()
        expect(requests.map((params) => params.get('startDate'))).toEqual([oneYearStart])
    })

    test('should not ask for a page of prices', async ({ worker }) => {
        const requests = answerByStartDate(worker)
        renderWithClient(detailsForProduct())

        await screen.findByText('Sep 1, 2026')

        expect(requests[0].has('page')).toBe(false)
        expect(requests[0].has('size')).toBe(false)
    })

    test('should show two years of prices in the list and chart after choosing 2 years', async ({ worker }) => {
        const requests = answerByStartDate(worker)
        const user = userEvent.setup()
        renderWithClient(detailsForProduct())
        await screen.findByText('Sep 1, 2026')

        await user.click(screen.getByText('2 years'))

        await expect.element(await screen.findByText('Mar 1, 2025')).toBeInTheDocument()
        await expect.element(await screen.findByText('Mar 1, 2025 12:00 PM')).toBeInTheDocument()
        expect(requests.at(-1)?.get('startDate')).toBe(twoYearsStart)
    })

    test('should show every price after choosing All', async ({ worker }) => {
        const requests = answerByStartDate(worker)
        const user = userEvent.setup()
        renderWithClient(detailsForProduct())
        await screen.findByText('Sep 1, 2026')

        await user.click(screen.getByText('All'))

        await expect.element(await screen.findByText('Jan 1, 2023')).toBeInTheDocument()
        await expect.element(await screen.findByText('Jan 1, 2023 12:00 PM')).toBeInTheDocument()
        expect(requests.at(-1)?.has('startDate')).toBe(false)
    })

    test('should keep each product to its own time range', async ({ worker }) => {
        answerByStartDate(worker)
        const user = userEvent.setup()
        renderWithClient(
            <>
                <div data-testid="first">{detailsForProduct(1)}</div>
                <div data-testid="second">{detailsForProduct(2)}</div>
            </>
        )
        const first = within(screen.getByTestId('first'))
        const second = within(screen.getByTestId('second'))
        await first.findByText('Sep 1, 2026')
        await second.findByText('Sep 1, 2026')

        await user.click(first.getByText('All'))

        await expect.element(await first.findByText('Jan 1, 2023')).toBeInTheDocument()
        expect(second.getByRole('radio', { name: '1 year' })).toBeChecked()
        expect(second.queryByText('Jan 1, 2023')).not.toBeInTheDocument()
    })

    // The chart shows the plain average, like the price list, from the product's whole history
    test('should keep the plain average line when the time range changes', async ({ worker }) => {
        answerByStartDate(worker)
        const user = userEvent.setup()
        const productBody = createProductBody(createProduct(1), {
            priceToday: recentPrice,
            averagePrice: 15,
            weightedAveragePrice: 17.5
        })
        renderWithClient(<ProductDetails productBody={productBody} dateToday={dateToday} setDateToday={() => {}} />)
        await expect.element(await screen.findByText('Average $15.00')).toBeInTheDocument()

        await user.click(screen.getByText('All'))
        await screen.findByText('1/1/2023')

        expect(screen.getByText('Average $15.00')).toBeInTheDocument()
        expect(screen.queryByText('Average $17.50')).not.toBeInTheDocument()
    })
})

describe('Product Details Layout', () => {
    // Below 1024 px wide the root font drops to 16 px, so use a desktop width to get desktop sizes
    let defaultViewport = { width: 0, height: 0 }
    beforeEach(async () => {
        defaultViewport = { width: window.innerWidth, height: window.innerHeight }
        await page.viewport(1280, 900)
    })
    afterEach(async () => {
        await page.viewport(defaultViewport.width, defaultViewport.height)
    })

    test('should be as tall with many prices as with a few', async ({ worker }) => {
        const { panel: fewPricesPanel } = await renderDetailsWithPrices(worker, createDailyPrices(2))
        const fewPricesHeight = fewPricesPanel.offsetHeight
        cleanup()

        const { panel: manyPricesPanel } = await renderDetailsWithPrices(worker, createDailyPrices(20))

        expect(manyPricesPanel.offsetHeight).toBe(fewPricesHeight)
    })

    test('should be as tall with content above the price list', async ({ worker }) => {
        const { panel: plainPanel } = await renderDetailsWithPrices(worker, createDailyPrices(20))
        const plainHeight = plainPanel.offsetHeight
        cleanup()

        // Stands in for the grouped view's store picker
        const { panel: panelWithPicker } = await renderDetailsWithPrices(
            worker,
            createDailyPrices(20),
            <div style={{ height: 40 }} />
        )

        expect(panelWithPicker.offsetHeight).toBe(plainHeight)
    })

    test('should be as tall while the prices load as once they show', async ({ worker }) => {
        let showPrices = () => {}
        const pricesShown = new Promise<void>((resolve) => (showPrices = resolve))
        // A test that ends early still lets the request finish
        onTestFinished(() => showPrices())
        worker.use(
            http.get(pricesApiUrl + '/product/:productId', async () => {
                await pricesShown
                return HttpResponse.json(createDailyPrices(2))
            })
        )
        renderDetails()
        const loadingHeight = getPanel().offsetHeight

        showPrices()
        await screen.findByText('Sep 1, 2026')

        expect(getPanel().offsetHeight).toBe(loadingHeight)
    })

    test('should scroll a long price list inside the panel', async ({ worker }) => {
        const { priceList } = await renderDetailsWithPrices(worker, createDailyPrices(20))

        // Only a scroll container moves; on anything else scrollTop stays at 0
        priceList.scrollTop = 50

        expect(priceList.scrollTop).toBe(50)
    })

    // The column can be too narrow for both beside the amount, so the time can move to its own line, but neither the
    // date nor the time is split, and neither runs into the amount. A deleted price is shown too, since a deleted
    // price's actions once made every row's actions wider, leaving the dates too little room
    test('should keep a date and its time each whole, without running into the amount', async ({ worker }) => {
        const prices = [
            createPrice(3, { priceStarted: new Date(2026, 8, 30, 12, 45).toISOString() }),
            createPrice(2, { priceStarted: new Date(2026, 8, 30, 9, 5).toISOString() }),
            createPrice(1, {
                priceStarted: new Date(2026, 8, 25, 12).toISOString(),
                deletedAt: new Date(2026, 8, 26, 12).toISOString()
            })
        ]
        const { priceList } = await renderDetailsWithPrices(worker, prices, undefined, 'Sep 30, 2026 12:45 PM')

        const date = within(priceList).getByText('Sep 30, 2026 12:45 PM')
        expect(staysOnOneLine(date, 'Sep 30, 2026')).toBe(true)
        expect(staysOnOneLine(date, '12:45 PM')).toBe(true)
        expect(date.scrollWidth).toBeLessThanOrEqual(date.clientWidth)
        const deletedDate = within(priceList).getByText('Sep 25, 2026')
        expect(countLines(deletedDate)).toBe(1)
        expect(deletedDate.scrollWidth).toBeLessThanOrEqual(deletedDate.clientWidth)
    })

    // Two lines fit a sale's end date after its description, which a single cut-off line would hide
    test('should wrap a long details line onto a second line and show all of it', async ({ worker }) => {
        const description = 'A description far too long to fit beside the amount in the narrow price column'
        await renderDetailsWithPrices(worker, [createPrice(1, { ...createDailyPrices(1)[0], description })])

        const details = screen.getByText(description)
        expect(countLines(details)).toBe(2)
        expect(details.scrollHeight).toBeLessThanOrEqual(details.clientHeight)
    })

    test('should cut off a details line after two lines', async ({ worker }) => {
        const description = 'A description far too long to fit beside the amount in the narrow price column. '.repeat(3)
        await renderDetailsWithPrices(worker, [createPrice(1, { ...createDailyPrices(1)[0], description })])

        const details = screen.getByText(description.trim())
        expect(details.clientHeight).toBe(2 * parseFloat(getComputedStyle(details).lineHeight))
        expect(details.scrollHeight).toBeGreaterThan(details.clientHeight)
    })

    // Under the amount and icons too, rather than only the date's part of the row, so less of it is cut off
    test('should give the details line the whole width of its row', async ({ worker }) => {
        const description = 'A description far too long to fit beside the amount in the narrow price column'
        await renderDetailsWithPrices(worker, [createPrice(1, { ...createDailyPrices(1)[0], description })])

        const details = screen.getByText(description)
        const row = details.closest('li')!
        const { paddingLeft, paddingRight } = getComputedStyle(row)
        expect(details.clientWidth).toBe(row.clientWidth - parseFloat(paddingLeft) - parseFloat(paddingRight))
    })

    // Like a table: amounts of different widths, and a deleted price, don't move the columns
    test('should line up the arrows, amounts, and actions buttons of every row', async ({ worker }) => {
        // Amounts of two widths, short enough to leave the rows spare width, which only the date should take
        const prices = [
            createPrice(4, { priceStarted: new Date(2026, 8, 4, 12).toISOString(), totalAmount: 9.5 }),
            createPrice(3, {
                priceStarted: new Date(2026, 8, 3, 12).toISOString(),
                totalAmount: 9,
                deletedAt: new Date(2026, 8, 5, 12).toISOString()
            }),
            createPrice(2, { priceStarted: new Date(2026, 8, 2, 12).toISOString(), totalAmount: 95 }),
            createPrice(1, { priceStarted: new Date(2026, 8, 1, 12).toISOString(), totalAmount: 9.25 })
        ]
        const { priceList } = await renderDetailsWithPrices(worker, prices)
        // A wide panel leaves the rows plenty of spare width, however wide the font makes the text
        screen.getByTestId('details-width').style.width = '1600px'

        const amounts = within(priceList).getAllByText(/^\$[\d,]+\.\d\d$/)
        const edges = (rects: DOMRect[], edge: 'left' | 'right') => new Set(rects.map((rect) => Math.round(rect[edge])))
        const boxes = (elements: Element[]) => elements.map((element) => element.getBoundingClientRect())
        // Where the text itself ends, since an amount's box fills its column however its text is aligned
        const textBoxes = (elements: Element[]) =>
            elements.map((element) => {
                const range = document.createRange()
                range.selectNodeContents(element)
                return range.getBoundingClientRect()
            })
        expect(amounts).toHaveLength(4)
        // The arrow's space sits just before each amount, whether or not the row has an arrow
        expect(edges(boxes(amounts.map((amount) => amount.previousElementSibling!)), 'left').size).toBe(1)
        expect(edges(textBoxes(amounts), 'right').size).toBe(1)
        const actionsButtons = within(priceList).getAllByRole('button', { name: 'Price actions' })
        expect(actionsButtons).toHaveLength(4)
        expect(edges(boxes(actionsButtons), 'left').size).toBe(1)

        // The date takes the leftover space, so the actions buttons end at the row's right edge
        const row = actionsButtons[0].closest('li')!
        const rowContentRight = row.getBoundingClientRect().right - parseFloat(getComputedStyle(row).paddingRight)
        // Within half a pixel, since spreading the spare width over every column moves it by only a little
        expect(actionsButtons[0].getBoundingClientRect().right).toBeCloseTo(rowContentRight, 0)
    })

    test('should keep a short price list at its own height', async ({ worker }) => {
        const { priceList } = await renderDetailsWithPrices(worker, createDailyPrices(2))
        // Exact heights, since a row can be a fraction of a pixel tall, which offsetHeight would round
        const rowsHeight = [...priceList.children].reduce((total, row) => total + row.getBoundingClientRect().height, 0)

        expect(priceList.getBoundingClientRect().height).toBeCloseTo(rowsHeight, 1)
    })
})
