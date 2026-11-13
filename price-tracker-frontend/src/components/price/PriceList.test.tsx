import { describe, expect } from 'vitest'
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
 * Render the price list, with the Show deleted prices checkbox working as it does in the app.
 * @param productBody The product the prices belong to
 * @param prices The prices to list, newest first, like the API sends them
 * @returns The render result
 */
const renderPriceList = (productBody = createProductBody(product), prices = [price1, price2]) => {
    // Holds the checkbox's state, which the list's parent keeps in the app
    function PriceListWithState() {
        const [checked, setChecked] = useState(false)

        return (
            <PriceList
                productBody={productBody}
                prices={prices}
                setDateToday={() => {}}
                showDeleted={checked}
                setShowDeleted={setChecked}
            />
        )
    }

    return renderWithClient(<PriceListWithState />)
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

    test('should show the start times of prices that start on the same day', async () => {
        renderPriceList(undefined, [priceOnSep4(2, 16, 30), priceOnSep4(1, 9, 5)])

        await expect.element(screen.getByText('Sep 4, 2026 4:30 PM')).toBeInTheDocument()
        await expect.element(screen.getByText('Sep 4, 2026 9:05 AM')).toBeInTheDocument()
    })

    // Non-breaking spaces hold the date and the time together, so a narrow column can only move the time to its own
    // line, never split "Sep 4, 2026" or "4:30 PM"
    test('should only let a date and time break between the date and the time', async () => {
        renderPriceList(undefined, [priceOnSep4(2, 16, 30), priceOnSep4(1, 9, 5)])

        // getByText treats every kind of space alike, so the exact characters are checked separately: non-breaking
        // spaces inside the date and the time, and one ordinary space between them
        const date = screen.getByText('Sep 4, 2026 4:30 PM')
        expect(date.textContent).toBe('Sep 4, 2026 4:30 PM')
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

    test('should render add price button', async () => {
        renderPriceList()

        const price1Date = screen.getByText(/add price/i)
        await expect.element(price1Date).toBeInTheDocument()
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

    // Deleted prices are in the list while Show deleted prices is on
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
    test('should end Quick Price after it starts when the newest price starts after today', async ({ worker }) => {
        const tomorrowNoon = dayjs().add(1, 'day').hour(12).startOf('hour')
        await openQuickPrice(worker, [{ ...newestPrice, priceStarted: tomorrowNoon.toISOString(), priceEnded: null }])

        await waitFor(() => expect(quickPriceFields().priceStarted).toBe(tomorrowNoon.format('MMM D, YYYY h:mm A')))
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

    test('should render show deleted prices checkbox', async () => {
        renderPriceList()

        const checkbox = screen.getByRole('checkbox', { name: /show deleted/i })
        await expect.element(checkbox).toBeInTheDocument()

        const price1Date = screen.getByText('Sep 4, 2026')
        await expect.element(price1Date).toBeInTheDocument()

        const price2Date = screen.getByText('Sep 5, 2026')
        await expect.element(price2Date).toBeInTheDocument()
    })

    test('should render checked checkbox', async () => {
        const user = userEvent.setup()

        renderPriceList()

        const checkbox = screen.getByRole('checkbox', { name: /show deleted/i })
        await expect.element(checkbox).toBeInTheDocument()
        await expect.element(checkbox).not.toBeChecked()
        await user.click(checkbox)
        await expect.element(checkbox).toBeChecked()
    })

    test('should show the average price', async () => {
        renderPriceList(createProductBody(product, averages))

        await expect.element(screen.getByText('Average price: $15.00')).toBeInTheDocument()
    })

    test("should format the average price with the product's currency", async () => {
        renderPriceList(createProductBody(product, { ...averages, priceToday: createPrice(1, { currency: 'EUR' }) }))

        await expect.element(screen.getByText('Average price: €15.00')).toBeInTheDocument()
    })

    test("should format the average price as USD when the product's prices have no currency", async () => {
        renderPriceList(createProductBody(product, { ...averages, priceToday: createPrice(1, { currency: '' }) }))

        await expect.element(screen.getByText('Average price: $15.00')).toBeInTheDocument()
    })

    test('should show the weighted average price when hovering the average price', async () => {
        const user = userEvent.setup()
        renderPriceList(createProductBody(product, averages))

        await user.hover(screen.getByText('Average price: $15.00'))

        await expect
            .element(await screen.findByText('Weighted by how long each price lasted: $17.50'))
            .toBeInTheDocument()
    })

    test('should not show the average price when the product has no average', async () => {
        renderPriceList(createProductBody(product, { averagePrice: null, weightedAveragePrice: null }))

        expect(screen.queryByText(/average price/i)).not.toBeInTheDocument()
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
