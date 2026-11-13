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
            <div style={{ width }}>
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
 * Measure the footer under the list inside its padding, where its lines start and end, for its layout tests.
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
 * Measure the Show deleted switch with its label, for the footer's layout tests.
 * @returns The box around the switch and its label
 */
const showDeletedSwitchBox = () =>
    screen.getByRole('switch', { name: 'Show deleted' }).closest('.mantine-Switch-root')!.getBoundingClientRect()

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

    test('should open the add price modal from the Add Price button', async () => {
        const user = userEvent.setup()
        renderPriceList()

        await user.click(screen.getByRole('button', { name: 'Add Price' }))

        await expect.element(await screen.findByRole('dialog', { name: 'Add Price' })).toBeInTheDocument()
    })

    test('should open the add price modal filled from the latest price from the Quick Price button', async ({
        worker
    }) => {
        worker.use(
            http.get(pricesApiUrl + '/recent/:productId', () =>
                HttpResponse.json({ ...emptyRecentPriceData, baseAmounts: [100], currencies: ['USD'] })
            )
        )
        const user = userEvent.setup()
        renderPriceList()

        await user.click(screen.getByRole('button', { name: 'Quick Price' }))

        const dialog = within(await screen.findByRole('dialog', { name: 'Add Price' }))
        const basePrice = dialog.getByRole('textbox', { name: /base price/i }) as HTMLInputElement
        await waitFor(() => expect(basePrice.value).toBe('100.00'))
    })

    // Quick Price copies the latest price, so there's nothing to copy yet
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

    // The narrowest the planned resizable split lets the list be. The switch can wrap to a line of its own there, but
    // the average shouldn't break between "Average" and its amount.
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

    // 240 px is the narrowest the planned resizable split lets the list be, tried in a window above 1024 px, where the
    // root font is 18 px and the buttons are at their widest. 220 px is about how wide the list is today in an 800 px
    // window, where the root font is 16 px. 280 px is still a little too narrow for the icons, so it checks they go for
    // every list too narrow for them, not just the narrowest.
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
