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

// A price starting at the given local time on Sep 4, 2026
const priceOnSep4 = (priceId: number, hour: number, minute = 0, changes: Partial<PriceType> = {}) =>
    createPrice(priceId, { priceStarted: new Date(2026, 8, 4, hour, minute).toISOString(), ...changes })

// A price with the given total, starting at noon on the given day of Sep 2026
const priceOnSep = (priceId: number, day: number, totalAmount: number, changes: Partial<PriceType> = {}) =>
    createPrice(priceId, { priceStarted: new Date(2026, 8, day, 12).toISOString(), totalAmount, ...changes })

// The names of the change arrows shown, from the top of the list
const changeArrows = () =>
    screen
        .queryAllByRole('img')
        .map((arrow) => arrow.getAttribute('aria-label'))
        .filter((name) => name !== null)

const GREEN = 'text-green-600'
const GRAY = 'text-raincloud'

const renderPriceList = (productBody = createProductBody(product), prices = [price1, price2]) => {
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

describe('Price List Component', () => {
    test('should render product prices', async () => {
        renderPriceList()

        const price1Date = screen.getByText('Sep 4, 2026')
        await expect.element(price1Date).toBeInTheDocument()

        const price2Date = screen.getByText('Sep 5, 2026')
        await expect.element(price2Date).toBeInTheDocument()
    })

    test("should list the prices as a list, without today's entry", async () => {
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

        const date = screen.getByText('Sep 4, 2026 4:30 PM')
        expect(date.textContent).toBe('Sep 4, 2026 4:30 PM')
    })

    test('should not show the start time of a price on a day of its own', async () => {
        renderPriceList(undefined, [price2, priceOnSep4(3, 16, 30), priceOnSep4(1, 9, 5)])

        await expect.element(screen.getByText('Sep 5, 2026')).toBeInTheDocument()
    })

    test('should count a deleted price that is shown as starting on the same day', async () => {
        renderPriceList(undefined, [priceOnSep4(2, 16, 30, { deletedAt: price2.priceStarted }), priceOnSep4(1, 9, 5)])

        await expect.element(screen.getByText('Sep 4, 2026 9:05 AM')).toBeInTheDocument()
    })

    // The list leaves out today's entry, a copy of the price in effect now, so it can't make another price show a time
    test("should not count today's entry as starting on the same day", async () => {
        renderPriceList(undefined, [priceOnSep4(2, 16, 30, { today: true }), priceOnSep4(1, 9, 5)])

        await expect.element(screen.getByText('Sep 4, 2026')).toBeInTheDocument()
    })

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

    test('should compare prices to the cent', async () => {
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
        renderPriceList(undefined, [priceOnSep(3, 6, 90), priceOnSep(2, 5, 80), priceOnSep(1, 4, 100)])

        expect(changeArrows()).toEqual(['Up $10.00 from $80.00', 'Down $20.00 from $100.00'])
    })

    // The list comes newest first from the backend, which orders prices that start together by ID
    test('should compare prices that start at the same time in the order they were added', async () => {
        const started = new Date(2026, 8, 4, 12).toISOString()
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

    test('should skip deleted prices, and not show an arrow on them', async () => {
        renderPriceList(undefined, [
            priceOnSep(3, 6, 90),
            priceOnSep(2, 5, 50, { deletedAt: new Date(2026, 8, 7, 12).toISOString() }),
            priceOnSep(1, 4, 100)
        ])

        expect(changeArrows()).toEqual(['Down $10.00 from $100.00'])
    })

    test('should not compare prices in different currencies', async () => {
        renderPriceList(undefined, [priceOnSep(2, 5, 80, { currency: 'EUR' }), priceOnSep(1, 4, 100)])

        await expect.element(screen.getByText('€80.00')).toBeInTheDocument()
        expect(changeArrows()).toEqual([])
    })

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
