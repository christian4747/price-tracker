import { describe, expect, onTestFinished } from 'vitest'
import {
    cleanup,
    createPrice,
    createProduct,
    createProductBody,
    renderWithClient,
    screen,
    test,
    useViewport,
    userEvent,
    waitFor,
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

/**
 * Render the details with the given prices, and wait for the first one to show in the price list.
 * @param worker The test's mock service worker, which serves the prices
 * @param prices The prices to serve, newest first like the API
 * @param children Anything to show above the price list, as the grouped list's store picker does
 * @param firstDate The date of the first row, to know the list has loaded
 * @returns The whole panel, and the scrolling list that holds the price rows
 */
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

/**
 * Count the lines an element's text takes up on screen, including any hidden past a line limit.
 * @param element The element whose text to measure
 * @returns The number of lines
 */
const countLines = (element: HTMLElement) => {
    // A range over the text has one box for each line the text is laid out on, so the distinct tops are the lines
    const range = document.createRange()
    range.selectNodeContents(element)
    return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size
}

/**
 * Check whether part of an element's text shows on a single line, so it wasn't split by a wrap.
 * @param element The element, whose first child is its text
 * @param part The part to check, such as "12:45 PM", written with ordinary spaces
 * @returns Whether the part sits on one line
 */
const staysOnOneLine = (element: HTMLElement, part: string) => {
    const text = element.firstChild!
    // The text holds non-breaking spaces, so they're matched as ordinary ones to find where the part starts
    const start = text.textContent!.replace(/\s/g, ' ').indexOf(part)
    const range = document.createRange()
    range.setStart(text, start)
    range.setEnd(text, start + part.length)
    return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size === 1
}

/**
 * Find the divider between the chart and the price list, wait for it to measure its width, and focus it, ready for
 * Home and End to move it to either pane's minimum. The split it moves is forgotten when the test finishes.
 * @returns The divider
 */
const focusMeasuredDivider = async () => {
    // The split is remembered, so later tests start from the default again
    onTestFinished(() => localStorage.removeItem('product-details-split'))
    const separator = screen.getByRole('separator', { name: 'Resize chart and price list' })
    // Until the split measures its width its limits are 0 and 100%, and Home and End would ignore the minimums
    await expect.poll(() => separator.getAttribute('aria-valuemin')).not.toBe('0')
    separator.focus()
    return separator
}

/**
 * Serve a failed first price request, and the live price for every request after it, to test retrying.
 * @returns The request handler
 */
const failFirstPriceRequest = () => {
    let requestCount = 0
    return http.get(pricesApiUrl + '/product/:productId', () => {
        requestCount++
        return requestCount === 1
            ? HttpResponse.json({ message: 'Server error' }, { status: 500 })
            : HttpResponse.json([livePrice])
    })
}

/**
 * Serve the live price, plus the deleted one when the list asks for deleted prices, to test the Show deleted switch.
 * @returns The request handler
 */
const serveDeletedPriceWhenAsked = () =>
    http.get(pricesApiUrl + '/product/:productId', ({ request }) => {
        const showDeleted = new URL(request.url).searchParams.get('showDeleted') === 'true'
        return HttpResponse.json(showDeleted ? [livePrice, deletedPrice] : [livePrice])
    })

/**
 * Get the labels of the chart's price scale, as drawn.
 * @param panel The details panel the chart is in
 * @returns The text of each label, or an empty list before the chart has drawn its scale
 */
const getChartScaleLabels = (panel: HTMLElement) =>
    [...panel.querySelectorAll('.recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value')].map(
        (label) => label.textContent ?? ''
    )

describe('Product Details Component', () => {
    test('should render product prices', async () => {
        renderWithClient(<ProductDetails productBody={productBody} dateToday={new Date()} setDateToday={() => {}} />)

        const price1Date = await screen.findByText('Sep 4, 2026')
        await expect.element(price1Date).toBeInTheDocument()

        const price2Date = await screen.findByText('Sep 5, 2026')
        await expect.element(price2Date).toBeInTheDocument()
    })

    test('should still list deleted prices when they are shown', async ({ worker }) => {
        worker.use(serveDeletedPriceWhenAsked())
        const user = userEvent.setup()
        renderWithClient(<ProductDetails productBody={productBody} dateToday={new Date()} setDateToday={() => {}} />)

        await screen.findByText('Sep 4, 2026')
        expect(screen.queryByText('Sep 5, 2026')).not.toBeInTheDocument()

        await user.click(screen.getByRole('switch', { name: 'Show deleted' }))

        await expect.element(await screen.findByText('Sep 5, 2026')).toBeInTheDocument()
    })

    test('should hide deleted prices again when the Show deleted switch is turned off', async ({ worker }) => {
        worker.use(serveDeletedPriceWhenAsked())
        const user = userEvent.setup()
        renderWithClient(<ProductDetails productBody={productBody} dateToday={new Date()} setDateToday={() => {}} />)
        await screen.findByText('Sep 4, 2026')
        await user.click(screen.getByRole('switch', { name: 'Show deleted' }))
        await screen.findByText('Sep 5, 2026')

        await user.click(screen.getByRole('switch', { name: 'Show deleted' }))

        await waitFor(() => expect(screen.queryByText('Sep 5, 2026')).not.toBeInTheDocument())
        expect(screen.getByText('Sep 4, 2026')).toBeInTheDocument()
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

    describe('in the list and the chart', () => {
        // Which dates the chart's axis labels depends on its width, since it leaves out labels that don't fit. At this
        // desktop width the chart is wide enough to label the oldest price in each range, which a narrower one may not.
        useViewport(1280, 900)

        /**
         * Find a label on the chart itself. Recharts measures each label it might draw with a hidden copy of its text in
         * the page's body, which keeps the last text measured, so a page-wide search can find a label the chart left out.
         * @param container The element the details were rendered into
         * @param text The label's text
         * @returns The label, once the chart draws it
         */
        const findChartLabel = (container: HTMLElement, text: string) =>
            within(container.querySelector<HTMLElement>('.recharts-wrapper')!).findByText(text)

        test('should show two years of prices in the list and chart after choosing 2 years', async ({ worker }) => {
            const requests = answerByStartDate(worker)
            const user = userEvent.setup()
            const { container } = renderWithClient(detailsForProduct())
            await screen.findByText('Sep 1, 2026')

            await user.click(screen.getByText('2 years'))

            await expect.element(await screen.findByText('Mar 1, 2025')).toBeInTheDocument()
            await expect.element(await findChartLabel(container, 'Mar 1, 2025 12:00 PM')).toBeInTheDocument()
            expect(requests.at(-1)?.get('startDate')).toBe(twoYearsStart)
        })

        test('should show every price after choosing All', async ({ worker }) => {
            const requests = answerByStartDate(worker)
            const user = userEvent.setup()
            const { container } = renderWithClient(detailsForProduct())
            await screen.findByText('Sep 1, 2026')

            await user.click(screen.getByText('All'))

            await expect.element(await screen.findByText('Jan 1, 2023')).toBeInTheDocument()
            await expect.element(await findChartLabel(container, 'Jan 1, 2023 12:00 PM')).toBeInTheDocument()
            expect(requests.at(-1)?.has('startDate')).toBe(false)
        })
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
        await screen.findByText('Jan 1, 2023')

        expect(screen.getByText('Average $15.00')).toBeInTheDocument()
        expect(screen.queryByText('Average $17.50')).not.toBeInTheDocument()
    })
})

describe('Product Details Currency', () => {
    // Before any price has started there's no price today to take the currency from, but the chart still draws the
    // prices (upcoming ones, say), so its scale is in their currency rather than the default one
    test("should label the chart in the prices' currency when no price is in effect today", async ({ worker }) => {
        const euroPrice = createPrice(1, { currency: 'EUR', priceStarted: new Date(2026, 8, 1, 12).toISOString() })
        const { panel } = await renderDetailsWithPrices(worker, [euroPrice])

        // The chart draws its scale after the list shows, so wait for its labels
        await expect.poll(() => getChartScaleLabels(panel)).not.toEqual([])
        expect(getChartScaleLabels(panel).every((label) => label.startsWith('€'))).toBe(true)
    })
})

describe('Product Details Layout', () => {
    // Below 1024 px wide the root font drops to 16 px, so use a desktop width to get desktop sizes
    useViewport(1280, 900)

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

    // The chart alone sets the panel's height, so neither the narrowest chart nor the narrowest price list changes it
    test('should be as tall after the divider between the chart and the price list moves', async ({ worker }) => {
        const user = userEvent.setup()
        const { panel } = await renderDetailsWithPrices(worker, createDailyPrices(20))
        const startHeight = panel.offsetHeight
        const separator = await focusMeasuredDivider()

        // The chart at its narrowest. The divider's value is checked too, so the test fails if it didn't move.
        await user.keyboard('{Home}')
        expect(separator).toHaveAttribute('aria-valuenow', separator.getAttribute('aria-valuemin'))
        expect(getPanel().offsetHeight).toBe(startHeight)

        // The price list at its narrowest
        await user.keyboard('{End}')
        expect(separator).toHaveAttribute('aria-valuenow', separator.getAttribute('aria-valuemax'))
        expect(getPanel().offsetHeight).toBe(startHeight)
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
        // Two prices on the same day, so their rows show times, on Sep 30 with its two-digit day and at 12:45 PM, about
        // the widest date and time there are
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
        // The column is too narrow for both on one line, so the checks below also cover where the wrap happens. If a
        // change ever made room for one line, they would pass without testing the wrap at all.
        expect(countLines(date)).toBe(2)
        expect(staysOnOneLine(date, 'Sep 30, 2026')).toBe(true)
        expect(staysOnOneLine(date, '12:45 PM')).toBe(true)
        // Text wider than its box would spill into the next column and overlap the amount beside it
        expect(date.scrollWidth).toBeLessThanOrEqual(date.clientWidth)
        const deletedDate = within(priceList).getByText('Sep 25, 2026')
        expect(countLines(deletedDate)).toBe(1)
        expect(deletedDate.scrollWidth).toBeLessThanOrEqual(deletedDate.clientWidth)
    })

    // The price list's minimum width is meant to leave room for its buttons and dates. Checked at the desktop font
    // size (this describe's viewport), the larger of the two, so it fits at both.
    test('should fit the buttons and whole dates in the narrowest price list', async ({ worker }) => {
        const user = userEvent.setup()
        // The widest date and time there are, as in the test above, on two prices the same day so their rows show times
        const prices = [
            createPrice(2, { priceStarted: new Date(2026, 8, 30, 12, 45).toISOString() }),
            createPrice(1, { priceStarted: new Date(2026, 8, 30, 9, 5).toISOString() })
        ]
        const { priceList } = await renderDetailsWithPrices(worker, prices, undefined, 'Sep 30, 2026 12:45 PM')
        const separator = await focusMeasuredDivider()

        // The price list at its narrowest
        await user.keyboard('{End}')
        expect(separator).toHaveAttribute('aria-valuenow', separator.getAttribute('aria-valuemax'))

        // A label wider than its button is cut off, as in "Add Pr"
        for (const name of ['Add Price', 'Quick Price']) {
            const label = screen.getByRole('button', { name }).querySelector('.mantine-Button-label') as HTMLElement
            expect(label.scrollWidth, name).toBeLessThanOrEqual(label.clientWidth)
        }
        // The date and time may sit on separate lines, but neither is split, and neither runs into the amount
        const date = within(priceList).getByText('Sep 30, 2026 12:45 PM')
        expect(staysOnOneLine(date, 'Sep 30, 2026')).toBe(true)
        expect(staysOnOneLine(date, '12:45 PM')).toBe(true)
        expect(date.scrollWidth).toBeLessThanOrEqual(date.clientWidth)
    })

    // Two lines fit a sale's end date after its description, which a single cut-off line would hide
    test('should wrap a long details line onto a second line and show all of it', async ({ worker }) => {
        const description = 'A description far too long to fit beside the amount in the narrow price column'
        await renderDetailsWithPrices(worker, [createPrice(1, { ...createDailyPrices(1)[0], description })])

        const details = screen.getByText(description)
        expect(countLines(details)).toBe(2)
        expect(details.scrollHeight).toBeLessThanOrEqual(details.clientHeight)
    })

    // A very long description stops after two lines, so it can't make its row much taller than the others
    test('should cut off a details line after two lines', async ({ worker }) => {
        // Three times the description that takes two lines, so it needs about six
        const description = 'A description far too long to fit beside the amount in the narrow price column. '.repeat(3)
        await renderDetailsWithPrices(worker, [createPrice(1, { ...createDailyPrices(1)[0], description })])

        // The text is trimmed on screen, so the trailing space from the repeat is dropped to find it
        const details = screen.getByText(description.trim())
        // The line shows two lines' height, with the rest of the text hidden below
        expect(details.clientHeight).toBe(2 * parseFloat(getComputedStyle(details).lineHeight))
        expect(details.scrollHeight).toBeGreaterThan(details.clientHeight)
    })

    // Under the amount and actions button too, rather than only the date's part of the row, so it has room to wrap
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
        // Amounts of two widths, short enough to leave the rows spare width, which only the date should take. Price 3
        // is deleted, since a deleted price's row once had a wider actions column than the others.
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

        // Every amount in the list, such as "$9.50"
        const amounts = within(priceList).getAllByText(/^\$[\d,]+\.\d\d$/)
        // The distinct positions of one edge across the boxes, to the pixel: a single one means they line up
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
        // Each row is only as tall as its tallest item needs. Without this, the check above would pass if the list
        // grew and the grid stretched its rows to fill it, since the rows would still add up to the list's height.
        for (const row of priceList.children) {
            const { paddingTop, paddingBottom, borderTopWidth, borderBottomWidth } = getComputedStyle(row)
            const tallestItem = Math.max(...[...row.children].map((item) => item.getBoundingClientRect().height))
            const naturalHeight =
                tallestItem +
                [paddingTop, paddingBottom, borderTopWidth, borderBottomWidth].reduce(
                    (total, value) => total + parseFloat(value),
                    0
                )
            expect(row.getBoundingClientRect().height).toBeCloseTo(naturalHeight, 1)
        }
    })
})

describe('Product Details Phone Layout', () => {
    // A phone's size, narrower than the chart's and price list's minimum widths side by side
    useViewport(375, 812)

    /**
     * Render the details at the phone's full width, as the modal does, with the given prices.
     * @param worker The test's mock service worker, which serves the prices
     * @param prices The prices to serve, newest first like the API
     * @returns The whole panel, and the scrolling list that holds the price rows
     */
    const renderPhoneDetailsWithPrices = async (worker: SetupWorker, prices: PriceType[]) => {
        worker.use(http.get(pricesApiUrl + '/product/:productId', () => HttpResponse.json(prices)))
        renderWithClient(
            <div data-testid="details-width">
                <ProductDetails productBody={productBody} dateToday={new Date()} setDateToday={() => {}} />
            </div>
        )
        const priceList = await screen.findByRole('list', { name: 'Prices' })
        await within(priceList).findByText('Sep 1, 2026')
        return { panel: getPanel(), priceList }
    }

    test('should put the price list under the chart, each the full width', async ({ worker }) => {
        const { panel, priceList } = await renderPhoneDetailsWithPrices(worker, createDailyPrices(2))
        // The box around both, inside the panel, which holds the chart and then the price list's column
        const boxElement = panel.firstElementChild!
        const box = boxElement.getBoundingClientRect()
        const chart = boxElement.firstElementChild!.getBoundingClientRect()
        const columnElement = boxElement.lastElementChild!
        expect(columnElement).toContainElement(priceList)
        const column = columnElement.getBoundingClientRect()

        expect(column.top).toBeGreaterThanOrEqual(chart.bottom)
        // Both span the box, inside its one-pixel border
        for (const part of [chart, column]) {
            expect(Math.abs(part.left - (box.left + 1))).toBeLessThan(1)
            expect(Math.abs(part.right - (box.right - 1))).toBeLessThan(1)
        }
    })

    // The divider's line is gone with it, so a plain line keeps the chart and the list apart, as beside each other
    test('should draw a line between the chart and the price list', async ({ worker }) => {
        const { priceList } = await renderPhoneDetailsWithPrices(worker, createDailyPrices(2))

        const column = getComputedStyle(priceList.parentElement!.parentElement!)
        expect(column.borderTopWidth).toBe('1px')
        expect(column.borderTopStyle).toBe('solid')
    })

    // Dragging a divider up and down on a phone would fight with scrolling the page
    test('should leave out the divider between the chart and the price list', async ({ worker }) => {
        await renderPhoneDetailsWithPrices(worker, createDailyPrices(2))

        expect(screen.queryByRole('separator', { name: 'Resize chart and price list' })).not.toBeInTheDocument()
    })

    // Nothing beside the list sets its height on a phone, so a long list would otherwise make the details very tall
    test('should keep the price list the same height with many prices, scrolling for the rest', async ({ worker }) => {
        const { priceList: fewPricesList } = await renderPhoneDetailsWithPrices(worker, createDailyPrices(2))
        const fewPricesHeight = fewPricesList.parentElement!.parentElement!.offsetHeight
        cleanup()

        const { priceList } = await renderPhoneDetailsWithPrices(worker, createDailyPrices(20))

        expect(priceList.parentElement!.parentElement!.offsetHeight).toBe(fewPricesHeight)
        // Only a scroll container moves; on anything else scrollTop stays at 0
        priceList.scrollTop = 50
        expect(priceList.scrollTop).toBe(50)
    })
})
