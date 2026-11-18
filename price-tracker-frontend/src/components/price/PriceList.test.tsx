import { describe, expect, onTestFinished } from 'vitest'
import { page } from 'vitest/browser'
import {
    createPrice,
    createProduct,
    createProductBody,
    renderWithClient,
    screen,
    test,
    userEvent,
    waitFor,
    within
} from '@/test-utils'
import { http, HttpResponse } from 'msw'
import type { SetupWorker } from 'msw/browser'
import dayjs from 'dayjs'
import type { PriceType } from '@/types/price'
import { PriceList } from './PriceList'
import { useState } from 'react'
// The footer's layout tests need the app's styles, for its flex layout and the font size
import '@/styles/index.css'

const pricesApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/prices'

// Like the API's prices, these have no product ID
const price1 = createPrice(1, { priceStarted: new Date(2026, 8, 4, 12).toISOString() })
const price2 = createPrice(2, { priceStarted: new Date(2026, 8, 5, 12).toISOString() })

const product = createProduct(1)
const deletedProduct = createProduct(1, { deletedAt: new Date(2026, 8, 6, 12).toISOString() })

const averages = { averagePrice: 15, weightedAveragePrice: 17.5 }

const emptyRecentPriceData = {
    baseAmounts: [],
    currencies: [],
    descriptions: [],
    discountPercentages: [],
    pricesStarted: [],
    pricesEnded: [],
    returnPercentages: [],
    pricePeriods: []
}

// Opens the edit modal for the first price of a product with ID 7, so a default ID can't match by accident
const openEditForProduct7 = async () => {
    const user = userEvent.setup()
    renderPriceList(createProductBody(createProduct(7)))
    await user.click(screen.getAllByRole('button', { name: 'Price actions' })[0])
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }))
    return user
}

/**
 * Make a price starting at the given local time on Sep 4, 2026, for tests of prices that share a day.
 * @param priceId The price's ID
 * @param hour The local hour it starts, from 0 to 23
 * @param minute The minute it starts
 * @param changes Any other fields to change
 * @returns The price
 */
const priceOnSep4 = (priceId: number, hour: number, minute = 0, changes: Partial<PriceType> = {}) =>
    createPrice(priceId, { priceStarted: new Date(2026, 8, 4, hour, minute).toISOString(), ...changes })

/**
 * Make a price with the given total, starting at noon on the given day of Sep 2026, for tests of the change arrows.
 * Noon keeps each price well inside its own local day.
 * @param priceId The price's ID
 * @param day The day of the month it starts
 * @param totalAmount The total the arrows compare
 * @param changes Any other fields to change
 * @returns The price
 */
const priceOnSep = (priceId: number, day: number, totalAmount: number, changes: Partial<PriceType> = {}) =>
    createPrice(priceId, { priceStarted: new Date(2026, 8, day, 12).toISOString(), totalAmount, ...changes })

/**
 * Get the change arrows the list shows, by the names screen readers hear.
 * @returns Each arrow's name, such as "Down $20.00 from $100.00", from the top of the list
 */
const changeArrows = () =>
    screen
        .queryAllByRole('img')
        .map((arrow) => arrow.getAttribute('aria-label'))
        .filter((name) => name !== null)

// The arrows' colors: green for a drop, gray for a rise or no change
const GREEN = 'text-green-600'
const GRAY = 'text-raincloud'

/**
 * A list with past, current, and upcoming prices, newest first, like the API sends it. Today's entry, starting Sep 6,
 * is a copy of price 2, the price in effect now, so prices 3 and 4 haven't started yet.
 */
const pricesAroundToday = [
    priceOnSep(4, 10, 90),
    priceOnSep(3, 8, 70),
    priceOnSep(2, 6, 80, { today: true }),
    priceOnSep(2, 5, 80),
    priceOnSep(1, 4, 100)
]

/**
 * Get the first line of a label or row's text, with plain spaces. Row dates hold together with non-breaking spaces,
 * which wouldn't equal the dates typed in a test.
 * @param line The label or row
 * @returns Its first line, such as "Upcoming" or "Sep 5, 2026"
 */
const firstLineOf = (line: Element) => (line as HTMLElement).innerText.split('\n')[0].replace(/\s/g, ' ')

/**
 * Get what the list shows, one entry per line it draws: each label's text, and each row's date.
 * @returns The labels and dates, from the top of the list
 */
const listLines = () => [...screen.getByRole('list', { name: 'Prices' }).children].map(firstLineOf)

/**
 * Get the dates of the rows marked as the price in effect now.
 * @returns Each current row's date, from the top of the list
 */
const currentRowDates = () =>
    [...screen.getByRole('list', { name: 'Prices' }).querySelectorAll('[aria-current="true"]')].map(firstLineOf)

/**
 * Render the price list, with the Show deleted switch working as it does in the app.
 * @param productBody The product the prices belong to
 * @param prices The prices to list, newest first, like the API sends them
 * @param width How wide the list is, in px, for layout tests; it fills the page when left out
 * @returns The render result
 */
const renderPriceList = (productBody = createProductBody(product), prices = [price1, price2], width?: number) => {
    // Holds the switch's state, which the list's parent keeps in the app
    function PriceListWithState() {
        const [checked, setChecked] = useState(false)

        return (
            // In the app the list sits in a Mantine accordion panel, which sets overflow-wrap: break-word, and the rows
            // inherit it. That lets the browser split a word that doesn't fit, so the tests get it too.
            <div style={{ width, overflowWrap: 'break-word' }}>
                <PriceList
                    productBody={productBody}
                    prices={prices}
                    setDateToday={() => {}}
                    showDeleted={checked}
                    setShowDeleted={setChecked}
                />
            </div>
        )
    }

    return renderWithClient(<PriceListWithState />)
}

/**
 * Find the average price under the list. Its amount sits in an element of its own, to take a stronger color, so the
 * text is matched by how it starts and the whole line is checked with toHaveTextContent.
 * @returns The element holding the whole "Average $X" text
 */
const averagePriceLine = () => screen.getByText(/^Average\b/)

/**
 * Make the test window the given width until the test ends. Above 1024 px the root font is 18 px, and below it 16 px,
 * which changes how much room the footer's text takes.
 * @param width The window's width, in px
 */
const useViewportWidth = async (width: number) => {
    const defaultViewport = { width: window.innerWidth, height: window.innerHeight }
    await page.viewport(width, 900)
    onTestFinished(() => page.viewport(defaultViewport.width, defaultViewport.height))
}

/**
 * Get the box of the footer under the list inside its padding, where its lines start and end, for its layout tests.
 * @returns The left and right edges of the footer's content
 */
const footerContentBox = () => {
    const footer = screen.getByRole('list', { name: 'Prices' }).nextElementSibling!
    const box = footer.getBoundingClientRect()
    const style = getComputedStyle(footer)
    return {
        left: box.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft),
        right: box.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight)
    }
}

/**
 * Get where the Show deleted switch and its label sit on the page, for the footer's layout tests. Mantine hides the
 * switch's input but stretches it over the switch and its label, so its box covers both.
 * @returns The edges of the switch and its label together
 */
const showDeletedSwitchBox = () => screen.getByRole('switch', { name: 'Show deleted' }).getBoundingClientRect()

/**
 * Get the lines the browser draws an element's text on, with plain spaces. Each character is measured on its own, and
 * characters at the same height share a line, so this shows where the text really wraps, even inside a word.
 * @param element The element whose text to split into lines
 * @returns Each drawn line's text, from the top, without the spaces at its ends
 */
const drawnLinesOf = async (element: Element) => {
    // The app's Inter font only loads once something uses it, and until then the text is drawn in a narrower fallback
    // font, which can fit on a line that Inter doesn't. Waiting for it makes the lines the same as in the app, however
    // early in the run the test is.
    await document.fonts.load(`${getComputedStyle(element).fontSize} Inter`)
    const lines = new Map<number, string>()
    const range = document.createRange()
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent ?? ''
        for (let i = 0; i < text.length; i++) {
            range.setStart(node, i)
            range.setEnd(node, i + 1)
            // A space where the text wraps can take no room and have no box, so it's left out with the line's ends
            const box = range.getClientRects()[0]
            if (!box) continue
            const top = Math.round(box.top)
            lines.set(top, (lines.get(top) ?? '') + text[i])
        }
    }

    return [...lines.keys()].sort((a, b) => a - b).map((top) => lines.get(top)!.replace(/\s/g, ' ').trim())
}

// The product's newest price, with every field Quick Price fills set apart from createPrice's defaults
const newestPrice = createPrice(3, {
    amount: 120,
    currency: 'EUR',
    discountPercentage: 0.25,
    returnPercentage: 0.1,
    priceStarted: new Date(2026, 8, 6, 12).toISOString(),
    priceEnded: new Date(2026, 8, 8, 12).toISOString()
})

// Recent price data whose first entries all differ from newestPrice, like the recent values of other products' prices
const otherRecentPriceData = {
    baseAmounts: [50],
    currencies: ['JPY'],
    descriptions: ['Recent description'],
    discountPercentages: [0.5],
    pricesStarted: [new Date(2026, 8, 1, 12).toISOString()],
    pricesEnded: [new Date(2026, 8, 2, 12).toISOString()],
    returnPercentages: [0.3],
    pricePeriods: []
}

/**
 * Open Quick Price for a product with the given prices, with the recent price data offering other values, and show the
 * end date. It waits for the recent data to load, so a field filled from it rather than from a listed price shows.
 * @param worker The mock service worker, to serve the recent price data
 * @param prices The prices to list, newest first, like the API sends them
 */
const openQuickPrice = async (worker: SetupWorker, prices: PriceType[]) => {
    worker.use(http.get(pricesApiUrl + '/recent/:productId', () => HttpResponse.json(otherRecentPriceData)))
    const user = userEvent.setup()
    renderPriceList(createProductBody(product), prices)

    await user.click(screen.getByRole('button', { name: 'Quick Price' }))
    // The recent description's button shows once the recent data has loaded
    await screen.findByRole('button', { name: 'Recent description' })
    // The end date is only shown for a start and end date
    await user.click(screen.getByRole('button', { name: 'Start and End Date' }))
}

/**
 * Get what the add price form shows in each field Quick Price fills.
 * @returns Each field's text, with the dates as the date pickers show them
 */
const quickPriceFields = () => {
    const inputValue = (name: string) => (screen.getByRole('textbox', { name }) as HTMLInputElement).value
    return {
        basePrice: inputValue('Base Price'),
        currency: inputValue('Currency'),
        discountPercentage: inputValue('Discount %'),
        returnPercentage: inputValue('Return %'),
        priceStarted: screen.getByRole('button', { name: 'Start Date' }).textContent,
        priceEnded: screen.getByRole('button', { name: 'End Date' }).textContent
    }
}

// What the form shows when Quick Price fills it from newestPrice
const newestPriceFields = {
    basePrice: '120.00',
    currency: 'EUR',
    discountPercentage: '25.00',
    returnPercentage: '10.00',
    priceStarted: 'Sep 6, 2026 12:00 PM',
    priceEnded: 'Sep 8, 2026 12:00 PM'
}

describe('Price List Component', () => {
    test('should render product prices', async () => {
        renderPriceList()

        const price1Date = screen.getByText('Sep 4, 2026')
        await expect.element(price1Date).toBeInTheDocument()

        const price2Date = screen.getByText('Sep 5, 2026')
        await expect.element(price2Date).toBeInTheDocument()
    })

    // A real list, so screen readers announce how many prices there are
    test("should list the prices as a list, without today's entry", async () => {
        // Today's entry is a copy of price 2, so only the two real prices should be listed
        renderPriceList(undefined, [priceOnSep(2, 6, 80, { today: true }), price2, price1])

        const list = screen.getByRole('list', { name: 'Prices' })
        expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    })

    // The "Upcoming" label is a line in the list, but not a price, so screen readers shouldn't count it as one
    test('should not count the Upcoming label as a price', async () => {
        renderPriceList(undefined, pricesAroundToday)

        const list = screen.getByRole('list', { name: 'Prices' })
        expect(within(list).getAllByRole('listitem')).toHaveLength(4)
    })

    // Today's entry is a copy of the price in effect now, with the same ID, which is how the list knows which it is
    test('should mark the price in effect now as current', async () => {
        renderPriceList(undefined, pricesAroundToday)

        await expect.element(screen.getByText('Sep 5, 2026')).toBeInTheDocument()
        expect(currentRowDates()).toEqual(['Sep 5, 2026'])
    })

    // The backend leaves out today's entry when no price has started, such as when every price is deleted
    test("should not mark any price as current without today's entry", async () => {
        renderPriceList(undefined, [price2, price1])

        await expect.element(screen.getByText('Sep 5, 2026')).toBeInTheDocument()
        expect(currentRowDates()).toEqual([])
    })

    test('should show the Upcoming label once, above the prices that start after now', async () => {
        renderPriceList(undefined, pricesAroundToday)

        await expect.element(screen.getByText('Upcoming')).toBeInTheDocument()
        expect(listLines()).toEqual(['Upcoming', 'Sep 10, 2026', 'Sep 8, 2026', 'Sep 5, 2026', 'Sep 4, 2026'])
    })

    test('should not show the Upcoming label without upcoming prices', async () => {
        renderPriceList(undefined, [priceOnSep(2, 6, 80, { today: true }), priceOnSep(2, 5, 80), priceOnSep(1, 4, 100)])

        await expect.element(screen.getByText('Sep 5, 2026')).toBeInTheDocument()
        expect(screen.queryByText('Upcoming')).not.toBeInTheDocument()
    })

    // A deleted price that hasn't started yet still starts after now, so it sits with the others when it's shown
    test('should put a deleted price that starts after now under the Upcoming label', async () => {
        renderPriceList(undefined, [
            priceOnSep(3, 8, 70, { deletedAt: new Date(2026, 8, 5, 12).toISOString() }),
            priceOnSep(2, 6, 80, { today: true }),
            priceOnSep(2, 5, 80),
            priceOnSep(1, 4, 100)
        ])

        await expect.element(screen.getByText('Upcoming')).toBeInTheDocument()
        expect(listLines()).toEqual(['Upcoming', 'Sep 8, 2026', 'Sep 5, 2026', 'Sep 4, 2026'])
    })

    // Without today's entry, the current time is the "now" that later prices are upcoming from. Years far from today
    // keep these on the same side of it whenever the test runs.
    test("should show the Upcoming label above prices that start in the future without today's entry", async () => {
        renderPriceList(undefined, [
            createPrice(2, { priceStarted: new Date(2100, 0, 1, 12).toISOString() }),
            createPrice(1, { priceStarted: new Date(2020, 0, 1, 12).toISOString() })
        ])

        await expect.element(screen.getByText('Upcoming')).toBeInTheDocument()
        expect(listLines()).toEqual(['Upcoming', 'Jan 1, 2100', 'Jan 1, 2020'])
    })

    test("should not show the Upcoming label for prices that started in the past without today's entry", async () => {
        renderPriceList(undefined, [createPrice(1, { priceStarted: new Date(2020, 0, 1, 12).toISOString() })])

        await expect.element(screen.getByText('Jan 1, 2020')).toBeInTheDocument()
        expect(screen.queryByText('Upcoming')).not.toBeInTheDocument()
    })

    // Today's entry starts on Sep 6, so a sale ending Sep 7 is still running, even though Sep 7 is past by the real
    // date. The same "now" decides what's upcoming, so the list can't call a price both upcoming and ended.
    test("should compare end dates with today's entry's start", async () => {
        renderPriceList(undefined, [
            priceOnSep(2, 6, 80, { today: true, priceEnded: new Date(2026, 8, 7, 23, 59).toISOString() }),
            priceOnSep(2, 5, 80, { priceEnded: new Date(2026, 8, 7, 23, 59).toISOString() }),
            priceOnSep(1, 4, 100, { priceEnded: new Date(2026, 8, 4, 23, 59).toISOString() })
        ])

        await expect.element(screen.getByText('until Sep 7')).toBeInTheDocument()
        await expect.element(screen.getByText('ended 11:59 PM')).toBeInTheDocument()
    })

    // Without today's entry, the current time is "now". Years far from today keep these on the same side of it
    // whenever the test runs.
    test("should say a price ended in the past ended without today's entry", async () => {
        renderPriceList(undefined, [
            createPrice(1, {
                priceStarted: new Date(2020, 0, 1, 12).toISOString(),
                priceEnded: new Date(2020, 0, 5, 23, 59).toISOString()
            })
        ])

        await expect.element(screen.getByText('ended Jan 5')).toBeInTheDocument()
    })

    test("should say a price ending in the future lasts until then without today's entry", async () => {
        renderPriceList(undefined, [
            createPrice(1, {
                priceStarted: new Date(2100, 0, 1, 12).toISOString(),
                priceEnded: new Date(2100, 0, 5, 23, 59).toISOString()
            })
        ])

        await expect.element(screen.getByText('until Jan 5')).toBeInTheDocument()
    })

    test('should show the start times of prices that start on the same day', async () => {
        renderPriceList(undefined, [priceOnSep4(2, 16, 30), priceOnSep4(1, 9, 5)])

        await expect.element(screen.getByText('Sep 4, 2026 4:30 PM')).toBeInTheDocument()
        await expect.element(screen.getByText('Sep 4, 2026 9:05 AM')).toBeInTheDocument()
    })

    // Non-breaking spaces hold "Sep 4" and "4:30 PM" together, so a narrow column can only move the year or the time to
    // a line of its own
    test('should only let a date and time break after the comma and between the date and the time', async () => {
        renderPriceList(undefined, [priceOnSep4(2, 16, 30), priceOnSep4(1, 9, 5)])

        // getByText treats every kind of space alike, so the exact characters are checked separately: non-breaking
        // spaces inside "Sep 4" and the time, and ordinary spaces after the comma and before the time
        const date = screen.getByText('Sep 4, 2026 4:30 PM')
        expect(date.textContent).toBe('Sep\u00a04, 2026 4:30\u00a0PM')
    })

    test('should only let a date without a time break after the comma', async () => {
        renderPriceList()

        const date = screen.getByText('Sep 4, 2026')
        expect(date.textContent).toBe('Sep\u00a04, 2026')
    })

    // The split beside the chart lets the list go down to 240 px, where the date doesn't fit on one line in a window
    // above 1024 px, with its 18 px root font. It should wrap after the comma, not partway through the year.
    test('should move the year to its own line when the list is too narrow for the date', async () => {
        await useViewportWidth(1280)
        renderPriceList(undefined, [price1, price2], 240)

        expect(await drawnLinesOf(screen.getByText('Sep 4, 2026'))).toEqual(['Sep 4,', '2026'])
    })

    // With a time too, the row has the most to fit. Wherever it wraps, each line should hold whole parts: "Sep 4,",
    // "2026", and "4:30 PM".
    test('should keep the parts of a date and time whole when the list is too narrow for them', async () => {
        await useViewportWidth(1280)
        renderPriceList(undefined, [priceOnSep4(2, 16, 30), priceOnSep4(1, 9, 5)], 240)

        const lines = await drawnLinesOf(screen.getByText('Sep 4, 2026 4:30 PM'))
        expect(lines.length, 'the date and time wrap').toBeGreaterThan(1)
        for (const line of lines) {
            expect(['Sep 4,', 'Sep 4, 2026', '2026', '2026 4:30 PM', '4:30 PM'], `"${line}" is whole parts`).toContain(
                line
            )
        }
    })

    test('should not show the start time of a price on a day of its own', async () => {
        renderPriceList(undefined, [price2, priceOnSep4(3, 16, 30), priceOnSep4(1, 9, 5)])

        await expect.element(screen.getByText('Sep 5, 2026')).toBeInTheDocument()
    })

    // With deleted prices shown, a deleted price's row is on screen, so its date could look like a duplicate too
    test('should count a deleted price that is shown as starting on the same day', async () => {
        renderPriceList(undefined, [priceOnSep4(2, 16, 30, { deletedAt: price2.priceStarted }), priceOnSep4(1, 9, 5)])

        await expect.element(screen.getByText('Sep 4, 2026 9:05 AM')).toBeInTheDocument()
    })

    // The list leaves out today's entry, a copy of the price in effect now, so it can't make another price show a time
    test("should not count today's entry as starting on the same day", async () => {
        renderPriceList(undefined, [priceOnSep4(2, 16, 30, { today: true }), priceOnSep4(1, 9, 5)])

        await expect.element(screen.getByText('Sep 4, 2026')).toBeInTheDocument()
    })

    // Days are counted in local time, so these an hour apart show as different dates, without times. In UTC they could
    // fall on the same day.
    test('should treat prices on either side of local midnight as different days', async () => {
        renderPriceList(undefined, [
            createPrice(2, { priceStarted: new Date(2026, 8, 5, 0, 30).toISOString() }),
            priceOnSep4(1, 23, 30)
        ])

        await expect.element(screen.getByText('Sep 5, 2026')).toBeInTheDocument()
        await expect.element(screen.getByText('Sep 4, 2026')).toBeInTheDocument()
    })

    test('should name a same-day price by its date and time when deleting it', async () => {
        const user = userEvent.setup()
        renderPriceList(undefined, [priceOnSep4(2, 16, 30), priceOnSep4(1, 9, 5)])

        // The second row, the 9:05 AM price
        await user.click(screen.getAllByRole('button', { name: 'Price actions' })[1])
        await user.click(await screen.findByRole('menuitem', { name: 'Delete' }))

        await expect.element(await screen.findByText(/delete Price Sep 4, 2026 9:05 AM/)).toBeInTheDocument()
    })

    test('should show a green down arrow when a price drops', async () => {
        renderPriceList(undefined, [priceOnSep(2, 5, 80), priceOnSep(1, 4, 100)])

        await expect.element(screen.getByRole('img', { name: 'Down $20.00 from $100.00' })).toHaveClass(GREEN)
    })

    test('should show a gray up arrow when a price rises', async () => {
        renderPriceList(undefined, [priceOnSep(2, 5, 109), priceOnSep(1, 4, 100)])

        await expect.element(screen.getByRole('img', { name: 'Up $9.00 from $100.00' })).toHaveClass(GRAY)
    })

    test('should show a gray flat arrow when a price stays the same', async () => {
        renderPriceList(undefined, [priceOnSep(2, 5, 100), priceOnSep(1, 4, 100)])

        await expect.element(screen.getByRole('img', { name: 'Same as the previous price' })).toHaveClass(GRAY)
    })

    // Saved totals can be a hair off, which shouldn't show as a rise
    test('should compare prices to the cent', async () => {
        // 100.004 rounds to the same cent as 100
        renderPriceList(undefined, [priceOnSep(2, 5, 100.004), priceOnSep(1, 4, 100)])

        await expect.element(screen.getByRole('img', { name: 'Same as the previous price' })).toBeInTheDocument()
    })

    test('should show the hover text of an arrow', async () => {
        const user = userEvent.setup()
        renderPriceList(undefined, [priceOnSep(2, 5, 80), priceOnSep(1, 4, 100)])

        await user.hover(screen.getByRole('img', { name: 'Down $20.00 from $100.00' }))

        await expect.element(await screen.findByRole('tooltip')).toHaveTextContent('Down $20.00 from $100.00')
    })

    test('should compare each price with the one before it, and not show an arrow on the oldest', async () => {
        // $100.00, then $80.00, then $90.00, listed newest first
        renderPriceList(undefined, [priceOnSep(3, 6, 90), priceOnSep(2, 5, 80), priceOnSep(1, 4, 100)])

        // Two arrows for three prices: the oldest has nothing before it
        expect(changeArrows()).toEqual(['Up $10.00 from $80.00', 'Down $20.00 from $100.00'])
    })

    // The list comes newest first from the backend, which orders prices that start together by ID
    test('should compare prices that start at the same time in the order they were added', async () => {
        const started = new Date(2026, 8, 4, 12).toISOString()
        // Price 1 was added first, so price 2 is compared with it, not the other way around
        renderPriceList(undefined, [
            createPrice(2, { priceStarted: started, totalAmount: 80 }),
            createPrice(1, { priceStarted: started, totalAmount: 100 })
        ])

        expect(changeArrows()).toEqual(['Down $20.00 from $100.00'])
    })

    // Today's entry is a copy of the price in effect now, with the same ID, so comparing it would compare that price
    // with itself
    test("should not compare today's entry", async () => {
        renderPriceList(undefined, [priceOnSep(2, 6, 80, { today: true }), priceOnSep(2, 5, 80), priceOnSep(1, 4, 100)])

        expect(changeArrows()).toEqual(['Down $20.00 from $100.00'])
    })

    // A deleted price no longer counts, so the next price compares with the one before the deleted one
    test('should skip deleted prices, and not show an arrow on them', async () => {
        // $100.00, a deleted $50.00, then $90.00: $90.00 compares with $100.00, not $50.00
        renderPriceList(undefined, [
            priceOnSep(3, 6, 90),
            priceOnSep(2, 5, 50, { deletedAt: new Date(2026, 8, 7, 12).toISOString() }),
            priceOnSep(1, 4, 100)
        ])

        expect(changeArrows()).toEqual(['Down $10.00 from $100.00'])
    })

    // €80.00 against $100.00 isn't a drop of 20 of anything
    test('should not compare prices in different currencies', async () => {
        renderPriceList(undefined, [priceOnSep(2, 5, 80, { currency: 'EUR' }), priceOnSep(1, 4, 100)])

        // Waits for the list to show, so the empty check below isn't made before anything renders
        await expect.element(screen.getByText('€80.00')).toBeInTheDocument()
        expect(changeArrows()).toEqual([])
    })

    // A blank currency counts as USD, as it does everywhere else in the app
    test('should compare a price with no currency as USD', async () => {
        renderPriceList(undefined, [priceOnSep(2, 5, 80, { currency: '' }), priceOnSep(1, 4, 100)])

        expect(changeArrows()).toEqual(['Down $20.00 from $100.00'])
    })

    test("should show changes in the price's currency", async () => {
        renderPriceList(undefined, [
            priceOnSep(2, 5, 80, { currency: 'EUR' }),
            priceOnSep(1, 4, 100, { currency: 'EUR' })
        ])

        expect(changeArrows()).toEqual(['Down €20.00 from €100.00'])
    })

    test('should open the add price modal from the Add Price button', async () => {
        const user = userEvent.setup()
        renderPriceList()

        await user.click(screen.getByRole('button', { name: 'Add Price' }))

        await expect.element(await screen.findByRole('dialog', { name: 'Add Price' })).toBeInTheDocument()
    })

    // Quick Price copies the newest price that isn't deleted, so there's nothing to copy yet
    test('should not show the Quick Price button for a product without prices', async () => {
        renderPriceList(undefined, [])

        expect(screen.getByRole('button', { name: 'Add Price' })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Quick Price' })).not.toBeInTheDocument()
    })

    // The backend rejects adding a price to a deleted product until the product is restored
    test('should not render the add price buttons for a deleted product', async () => {
        renderPriceList(createProductBody(deletedProduct))

        await expect.element(screen.getByText('Sep 4, 2026')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Add Price' })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Quick Price' })).not.toBeInTheDocument()
    })

    test("should fill every Quick Price field from the product's newest price", async ({ worker }) => {
        await openQuickPrice(worker, [newestPrice, price2, price1])

        await waitFor(() => expect(quickPriceFields()).toEqual(newestPriceFields))
    })

    // The recent price data lists values by when prices were entered, which isn't what the list goes by
    test('should fill Quick Price from the price that started last, not the one entered last', async ({ worker }) => {
        const enteredLast = createPrice(4, {
            amount: 90,
            priceStarted: new Date(2026, 8, 5, 12).toISOString(),
            createdAt: new Date(2026, 8, 20, 12).toISOString()
        })

        await openQuickPrice(worker, [newestPrice, enteredLast, price1])

        await waitFor(() => expect(quickPriceFields()).toEqual(newestPriceFields))
    })

    // Deleted prices are in the list while Show deleted is on
    test('should skip deleted prices in Quick Price', async ({ worker }) => {
        const deletedPrice = createPrice(4, {
            amount: 90,
            priceStarted: new Date(2026, 8, 7, 12).toISOString(),
            deletedAt: new Date(2026, 8, 9, 12).toISOString()
        })

        await openQuickPrice(worker, [deletedPrice, newestPrice, price2])

        await waitFor(() => expect(quickPriceFields()).toEqual(newestPriceFields))
    })

    // Today's entry is a copy of the price in effect now, starting now, so its start date isn't a real price's
    test("should skip today's entry in Quick Price", async ({ worker }) => {
        const todayEntry = { ...newestPrice, today: true, priceStarted: new Date(2026, 8, 10, 12).toISOString() }

        await openQuickPrice(worker, [todayEntry, newestPrice, price2])

        await waitFor(() => expect(quickPriceFields()).toEqual(newestPriceFields))
    })

    // The recent end dates leave out prices with no end date, so their first entry belongs to some other price
    // Like a new price, it ends at the end of its start day, so a start and end date starts out valid
    test('should end Quick Price on its start day when the newest price has no end date', async ({ worker }) => {
        await openQuickPrice(worker, [{ ...newestPrice, priceEnded: null }, price2])

        await waitFor(() =>
            expect(quickPriceFields()).toEqual({ ...newestPriceFields, priceEnded: 'Sep 6, 2026 11:59 PM' })
        )
    })

    // The form's own default end date is the end of today, which comes before a price that starts after today
    // "Tomorrow" moves with the clock, so the expected end is worked out from the start rather than written out
    test('should end Quick Price at the end of its start day when the newest price starts after today', async ({
        worker
    }) => {
        const tomorrowNoon = dayjs().add(1, 'day').hour(12).startOf('hour')
        await openQuickPrice(worker, [{ ...newestPrice, priceStarted: tomorrowNoon.toISOString(), priceEnded: null }])

        await waitFor(() =>
            expect(quickPriceFields()).toMatchObject({
                priceStarted: tomorrowNoon.format('MMM D, YYYY h:mm A'),
                priceEnded: tomorrowNoon.endOf('day').format('MMM D, YYYY h:mm A')
            })
        )
        expect(screen.queryByText('End date must be after the start date')).not.toBeInTheDocument()
    })

    test('should not offer Quick Price when every listed price is deleted', async () => {
        renderPriceList(createProductBody(product), [{ ...price1, deletedAt: new Date(2026, 8, 6, 12).toISOString() }])

        await expect.element(screen.getByRole('button', { name: 'Add Price' })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Quick Price' })).not.toBeInTheDocument()
    })

    test("should not offer to edit a deleted product's prices", async () => {
        const user = userEvent.setup()
        renderPriceList(createProductBody(deletedProduct))

        await user.click(screen.getAllByRole('button', { name: 'Price actions' })[0])
        await screen.findByRole('menu')

        expect(screen.queryByRole('menuitem', { name: 'Edit' })).not.toBeInTheDocument()
    })

    test('should show a Show deleted switch, turned off at first', async () => {
        renderPriceList()

        await expect.element(screen.getByRole('switch', { name: 'Show deleted' })).not.toBeChecked()
    })

    test('should turn the Show deleted switch on when clicked', async () => {
        const user = userEvent.setup()
        renderPriceList()

        await user.click(screen.getByRole('switch', { name: 'Show deleted' }))

        await expect.element(screen.getByRole('switch', { name: 'Show deleted' })).toBeChecked()
    })

    test('should show the average price', async () => {
        renderPriceList(createProductBody(product, averages))

        expect(averagePriceLine()).toHaveTextContent('Average $15.00')
    })

    test("should format the average price with the product's currency", async () => {
        renderPriceList(createProductBody(product, { ...averages, priceToday: createPrice(1, { currency: 'EUR' }) }))

        expect(averagePriceLine()).toHaveTextContent('Average €15.00')
    })

    test("should format the average price as USD when the product's prices have no currency", async () => {
        renderPriceList(createProductBody(product, { ...averages, priceToday: createPrice(1, { currency: '' }) }))

        expect(averagePriceLine()).toHaveTextContent('Average $15.00')
    })

    test('should show the weighted average price when hovering the average price', async () => {
        const user = userEvent.setup()
        renderPriceList(createProductBody(product, averages))

        await user.hover(averagePriceLine())

        await expect
            .element(await screen.findByText('Weighted by how long each price lasted: $17.50'))
            .toBeInTheDocument()
    })

    test('should not show the average price when the product has no average', async () => {
        renderPriceList(createProductBody(product, { averagePrice: null, weightedAveragePrice: null }))

        expect(screen.queryByText(/average/i)).not.toBeInTheDocument()
    })

    // The split beside the chart keeps the list at least 320 px wide, but gives that up when the details are too narrow
    // for both panes, so the list can be narrower than this. The switch can wrap to a line of its own there, but the
    // average shouldn't break between "Average" and its amount.
    test('should keep the average price on one line when the list is narrow', async () => {
        renderPriceList(createProductBody(product, { ...averages, averagePrice: 12345.67 }), [price1, price2], 240)

        // The average is a flex item, so it's laid out as a block and has one box however many lines it takes. Its
        // height tells them apart instead.
        const line = averagePriceLine()
        const lineHeight = parseFloat(getComputedStyle(line).lineHeight)
        expect(line.getBoundingClientRect().height).toBeLessThan(lineHeight * 1.5)
    })

    test('should show the Show deleted switch at the right end of the average price line when there is room', async () => {
        renderPriceList(createProductBody(product, { ...averages, averagePrice: 12345.67 }), [price1, price2], 400)

        const average = averagePriceLine().getBoundingClientRect()
        const showDeleted = showDeletedSwitchBox()
        const footerLine = averagePriceLine().parentElement!.getBoundingClientRect()
        expect(showDeleted.top, 'switch starts above the average ends').toBeLessThan(average.bottom)
        expect(showDeleted.right, 'switch ends at the right edge').toBeCloseTo(footerLine.right, 0)
    })

    test('should move the Show deleted switch under the average price when the list is narrow', async () => {
        renderPriceList(createProductBody(product, { ...averages, averagePrice: 12345.67 }), [price1, price2], 240)

        expect(showDeletedSwitchBox().top).toBeGreaterThanOrEqual(averagePriceLine().getBoundingClientRect().bottom)
    })

    test('should share the width of the footer between the Add Price and Quick Price buttons', async () => {
        renderPriceList(undefined, [price1, price2], 400)

        const add = screen.getByRole('button', { name: 'Add Price' }).getBoundingClientRect()
        const quick = screen.getByRole('button', { name: 'Quick Price' }).getBoundingClientRect()
        const footer = footerContentBox()
        expect(add.left, 'Add Price starts at the left edge').toBeCloseTo(footer.left, 0)
        expect(quick.right, 'Quick Price ends at the right edge').toBeCloseTo(footer.right, 0)
        expect(add.width, 'both buttons are as wide').toBeCloseTo(quick.width, 0)
    })

    // The split beside the chart keeps the list at least 320 px wide, but gives that up when the details are too narrow
    // for both panes, so the list can be narrower. 240 px and 280 px are tried in a window above 1024 px, where the root
    // font is 18 px and the buttons are at their widest, and 220 px in a window below it, where the root font is 16 px.
    // 280 px is still a little too narrow for the icons, so it checks they go for every list too narrow for them, not
    // just the narrowest.
    test.for([
        { windowWidth: 1280, listWidth: 240 },
        { windowWidth: 1280, listWidth: 280 },
        { windowWidth: 900, listWidth: 220 }
    ])(
        'should keep both buttons and their labels inside the footer in a $windowWidth px window with a $listWidth px list',
        async ({ windowWidth, listWidth }) => {
            await useViewportWidth(windowWidth)
            renderPriceList(undefined, [price1, price2], listWidth)

            const footer = footerContentBox()
            const add = screen.getByRole('button', { name: 'Add Price' }).getBoundingClientRect()
            const quick = screen.getByRole('button', { name: 'Quick Price' }).getBoundingClientRect()
            expect(quick.right, 'Quick Price ends inside the footer').toBeLessThanOrEqual(footer.right + 0.5)
            expect(add.width, 'both buttons are as wide').toBeCloseTo(quick.width, 0)
            for (const name of ['Add Price', 'Quick Price']) {
                const label = screen.getByRole('button', { name }).querySelector('.mantine-Button-label')!
                expect(label, `${name}'s label shows`).toBeVisible()
                expect(label.scrollWidth, `${name}'s label is cut off`).toBeLessThanOrEqual(label.clientWidth)
            }
        }
    )

    // The icons only go when the buttons would otherwise not fit
    test("should show the buttons' icons when the list has room for them", async () => {
        await useViewportWidth(1280)
        renderPriceList(undefined, [price1, price2], 322)

        for (const name of ['Add Price', 'Quick Price']) {
            const icon = screen.getByRole('button', { name }).querySelector('svg')!
            expect(icon, `${name}'s icon shows`).toBeVisible()
        }
    })

    test("should ask for the product's recent prices when editing a price", async ({ worker }) => {
        let requestedProductId: string | undefined
        worker.use(
            http.get(pricesApiUrl + '/recent/:productId', ({ params }) => {
                requestedProductId = params.productId as string
                return HttpResponse.json(emptyRecentPriceData)
            })
        )
        await openEditForProduct7()

        await waitFor(() => expect(requestedProductId).toBe('7'))
    })

    test("should save an edited price with the product's ID", async ({ worker }) => {
        let savedBody: { productId?: number } | undefined
        worker.use(
            http.put(pricesApiUrl + '/:priceId', async ({ request }) => {
                savedBody = (await request.json()) as { productId?: number }
                return HttpResponse.json(price1)
            })
        )
        const user = await openEditForProduct7()

        await user.click(await screen.findByRole('button', { name: 'Edit Price' }))

        await waitFor(() => expect(savedBody).toBeDefined())
        expect(savedBody?.productId).toBe(7)
    })
})
