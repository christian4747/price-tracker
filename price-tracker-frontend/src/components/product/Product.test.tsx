import { describe, expect } from 'vitest'
import { userEvent as pointer } from 'vitest/browser'
import {
    createPrice,
    createProduct,
    createProductBody,
    renderWithClient,
    screen,
    test,
    useViewport,
    userEvent,
    within
} from '@/test-utils'
import type { ProductBody } from '@/types/product'
import { Product } from './Product'
import { http, HttpResponse } from 'msw'
import { getPriceString } from '@/utils/priceUtils'
// The actions button fades in and out with Tailwind classes, so the visibility tests need the app's styles
import '@/styles/index.css'

const product = createProduct(1, { name: 'Product 1' })

const price1 = createPrice(1)

const productBody = createProductBody(product, { priceToday: price1 })

// Built from local times so the expected text doesn't depend on the test machine's time zone
const datedProductBody: ProductBody = {
    ...productBody,
    product: {
        ...product,
        createdAt: new Date(2026, 7, 31, 14, 5).toISOString(),
        updatedAt: new Date(2026, 9, 28, 9, 30).toISOString()
    }
}
const datesText = 'Added Aug 31, 2026 2:05 PM · Last updated Oct 28, 2026 9:30 AM'

// Long enough that each part reaches its maximum width in a row, and needs more than one line in a narrow header
const longProduct = createProduct(1, {
    name: 'Extra large adjustable standing desk converter with keyboard tray and monitor shelf',
    store: 'Maple Home Goods and Furniture Outlet',
    brand: 'Meridian Workspace Solutions International'
})

/**
 * Render a product's row, with its details closed.
 * @param body The product to show, the usual one unless a test needs another
 * @returns What renderWithClient returns
 */
const renderProduct = (body: ProductBody = productBody) =>
    renderWithClient(<Product productBody={body} setDateToday={() => {}} dateToday={new Date()} />)

/**
 * Get the button that makes up the top of the product's row and opens its details.
 * @returns The row's button
 */
const rowButton = () => document.querySelector<HTMLElement>('button[aria-haspopup="dialog"]')!

/**
 * Open the product's details from its row, as a click would.
 * @returns The details' window
 */
const openDetails = async () => {
    await userEvent.setup().click(rowButton())
    return screen.findByRole('dialog')
}

/**
 * Find the price list's column, which holds the list and the footer under it. The chart beside it shows an
 * "Average $X" of its own, so checking inside the column makes sure the text is the list's.
 * @returns The column, or null before the prices have loaded
 */
const priceListColumn = () => screen.queryByRole('list', { name: 'Prices' })?.parentElement ?? null

describe('Product title layout', () => {
    // Above 1024 px wide the root font is 18 px, so the title's parts reach their desktop maximum widths
    useViewport(1280, 900)

    // The name, store, and brand each cut off at a maximum width, but at those maximums together they need more room
    // than a row leaves beside the price, so the title has to shrink rather than push the price out
    test("should keep the price inside its row when the product's name, store, and brand are long", async () => {
        // 800 px, narrower than the three maximum widths added up (about 836 px), so a title that can't shrink has to
        // push the price out
        renderWithClient(
            <div style={{ width: 800 }}>
                <Product
                    productBody={createProductBody(longProduct, { priceToday: price1 })}
                    setDateToday={() => {}}
                    dateToday={new Date()}
                />
            </div>
        )

        const row = rowButton().parentElement!.getBoundingClientRect()
        const price = (await within(rowButton()).findByText(getPriceString(price1))).getBoundingClientRect()
        expect(price.right, `price ends at ${price.right} px, row at ${row.right} px`).toBeLessThanOrEqual(row.right)
    })
})

describe('Product details window size', () => {
    /**
     * Get the size of the area a fixed element fills, which is the screen a modal can cover. The test browser's frame
     * can leave this narrower than the window it reports, so it's measured rather than taken from the viewport size.
     * @returns The area's width and height
     */
    const getScreenArea = () => {
        const probe = document.createElement('div')
        probe.style.cssText = 'position: fixed; inset: 0; pointer-events: none'
        document.body.append(probe)
        const { width, height } = probe.getBoundingClientRect()
        probe.remove()
        return { width, height }
    }

    describe('on a phone', () => {
        useViewport(375, 812)

        // A phone has no room to spare around a window, and the chart and price list need all of its width
        test("should fill the phone's screen with the details", async () => {
            renderProduct()
            const { width, height } = getScreenArea()

            const dialog = (await openDetails()).getBoundingClientRect()

            expect([dialog.left, dialog.top, dialog.width, dialog.height]).toEqual([0, 0, width, height])
        })
    })

    describe('at desktop width', () => {
        useViewport(1280, 900)

        // The list stays in view around the details on a wider screen
        test('should show the details in a centered window, narrower than the screen', async () => {
            renderProduct()
            const { width, height } = getScreenArea()

            const dialog = (await openDetails()).getBoundingClientRect()

            expect(dialog.width).toBeLessThan(width)
            expect(Math.abs(dialog.left - (width - dialog.right))).toBeLessThan(1)
            expect(Math.abs(dialog.top - (height - dialog.bottom))).toBeLessThan(1)
        })
    })
})

describe('Product details header layout at desktop width', () => {
    useViewport(1280, 900)

    // As in the row, where the price sits at the right end rather than right after the name
    test("should put the price of a short title beside the header's buttons", async () => {
        renderProduct()
        const dialog = await openDetails()

        const price = within(within(dialog).getByRole('heading'))
            .getByText(getPriceString(price1))
            .getBoundingClientRect()
        // The first of the header's buttons, before the close button
        const actions = within(dialog).getByRole('button', { name: 'Product actions' }).getBoundingClientRect()
        // The title bar's own right padding and Mantine's gap before the buttons, with room to spare
        expect(actions.left - price.right).toBeLessThan(32)
    })

    // Both sit on the title bar's first line, so they line up with each other as well as with the price
    test('should line up the actions button with the close button', async () => {
        renderProduct()
        const dialog = await openDetails()

        const actions = within(dialog).getByRole('button', { name: 'Product actions' }).getBoundingClientRect()
        const close = within(dialog).getByRole('button', { name: 'Close details' }).getBoundingClientRect()
        expect(Math.abs((actions.top + actions.bottom) / 2 - (close.top + close.bottom) / 2)).toBeLessThan(1)
    })

    // A wide header has room for the price beside even a long title, which wraps there instead
    test('should keep the price beside a long title when there is room', async () => {
        renderProduct(createProductBody(longProduct, { priceToday: price1 }))
        const heading = within(await openDetails()).getByRole('heading')
        const titleBar = heading.firstElementChild as HTMLElement

        const price = within(heading).getByText(getPriceString(price1)).getBoundingClientRect()
        const firstLineBottom = titleBar.getBoundingClientRect().top + parseFloat(getComputedStyle(titleBar).minHeight)
        expect(price.bottom).toBeLessThanOrEqual(firstLineBottom)
    })
})

describe('Product details header layout', () => {
    // A phone's width, where the long title needs several lines
    useViewport(400, 800)

    /**
     * Open the long product's details.
     * @returns The details' header title, which holds the title bar
     */
    const openLongProductDetails = async () => {
        renderProduct(createProductBody(longProduct, { priceToday: price1 }))
        const dialog = await openDetails()
        return within(dialog).getByRole('heading')
    }

    // The header has room for more than one line, unlike the row, so nothing needs cutting off there
    test("should show the whole name, store, and brand in the details' header", async () => {
        const heading = await openLongProductDetails()

        expect(heading).toHaveTextContent(longProduct.name)
        expect(heading).toHaveTextContent(longProduct.store)
        expect(heading).toHaveTextContent(longProduct.brand!)
        // Nothing in the header hides text it can't fit, and nothing reaches past the header's edge
        const headingRight = heading.getBoundingClientRect().right
        for (const element of heading.querySelectorAll<HTMLElement>('*')) {
            if (getComputedStyle(element).overflowX !== 'visible') {
                expect(element.scrollWidth, element.textContent ?? '').toBeLessThanOrEqual(element.clientWidth)
            }
            expect(element.getBoundingClientRect().right, element.textContent ?? '').toBeLessThanOrEqual(headingRight)
        }
    })

    // A model number or a pasted code has no spaces to wrap at, so it has to break between letters instead
    test("should keep a single word too long for a line inside the details' header", async () => {
        const unbrokenName = 'Model' + 'X'.repeat(60)
        renderProduct(createProductBody(createProduct(1, { name: unbrokenName }), { priceToday: price1 }))
        const dialog = await openDetails()

        // Measured against the window's edge, which stays put. The header and the close button would both move out
        // along with a word that can't break.
        const name = within(dialog).getByText(unbrokenName).getBoundingClientRect()
        expect(name.right).toBeLessThanOrEqual(dialog.getBoundingClientRect().right)
    })

    test('should still cut off a long name in the row', async () => {
        await openLongProductDetails()

        const rowName = within(rowButton()).getByText(longProduct.name)
        expect(rowName.scrollWidth).toBeGreaterThan(rowName.clientWidth)
    })

    test('should keep a long title clear of the close button', async () => {
        const heading = await openLongProductDetails()

        const close = screen.getByRole('button', { name: 'Close details' }).getBoundingClientRect()
        expect(heading.getBoundingClientRect().right).toBeLessThanOrEqual(close.left)
    })

    // Mantine centers the close button on the whole header, which would leave it halfway down a tall one. Centered
    // on the title bar's first line instead, it lines up with the price whenever the title fits on one line
    test("should keep the close button on the header's first line when the title takes several lines", async () => {
        const heading = await openLongProductDetails()
        const titleBar = heading.firstElementChild as HTMLElement
        const lineHeight = parseFloat(getComputedStyle(titleBar).minHeight)
        // Several lines, so a button centered on the whole header would sit well below the first line
        expect(titleBar.getBoundingClientRect().height).toBeGreaterThan(2 * lineHeight)

        const close = screen.getByRole('button', { name: 'Close details' }).getBoundingClientRect()
        const firstLineMiddle = titleBar.getBoundingClientRect().top + lineHeight / 2
        expect(Math.abs((close.top + close.bottom) / 2 - firstLineMiddle)).toBeLessThan(1)
    })
})

describe('Product Component', () => {
    test('should render product name', async () => {
        renderProduct()

        await expect.element(within(rowButton()).getByText('Product 1')).toBeInTheDocument()
    })

    test('should keep the details closed until the row is clicked', async () => {
        renderProduct(datedProductBody)

        await expect.element(within(rowButton()).getByText('Product 1')).toBeInTheDocument()
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        // A closed window keeps its content in the page, just hidden
        expect(screen.getByText(datesText)).not.toBeVisible()
        expect(rowButton()).toHaveAttribute('aria-expanded', 'false')
    })

    test('should open the details in a window when the row is clicked', async () => {
        renderProduct(datedProductBody)

        const dialog = await openDetails()

        await expect.element(within(dialog).getByText(datesText)).toBeVisible()
        expect(rowButton()).toHaveAttribute('aria-expanded', 'true')
    })

    // So the name, banner, discount, and price stay in view above the chart and price list, as they did above an
    // open row
    test("should show the row's title bar in the details' header", async () => {
        renderProduct()

        const heading = within(await openDetails()).getByRole('heading')

        expect(heading).toHaveTextContent('Product 1')
        expect(heading).toHaveTextContent(getPriceString(price1))
    })

    // The theme makes modal titles large and bold, which would make the header's title bar look unlike the row's
    test("should show the header's title bar at the row's sizes", async () => {
        renderProduct()
        const header = within(within(await openDetails()).getByRole('heading'))
        const row = within(rowButton())

        for (const text of [product.store, getPriceString(price1)]) {
            const headerStyle = getComputedStyle(header.getByText(text))
            const rowStyle = getComputedStyle(row.getByText(text))
            expect(headerStyle.fontSize, text).toBe(rowStyle.fontSize)
            expect(headerStyle.fontWeight, text).toBe(rowStyle.fontWeight)
        }
    })

    test('should close the details from the close button', async () => {
        const user = userEvent.setup()
        renderProduct()
        await openDetails()

        await user.click(screen.getByRole('button', { name: 'Close details' }))

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(rowButton()).toHaveAttribute('aria-expanded', 'false')
    })

    // On a phone the details fill the screen, and the back gesture is how people close what fills it
    test('should close the details on going back, staying on the page', async () => {
        const address = location.href
        renderProduct()
        await openDetails()

        // The details' own entry, so going back can't leave the test's page instead
        expect(history.state).toMatchObject({ closeOnBackEntry: expect.any(Number) })

        // Going back finishes after the call returns, with the browser's popstate event
        const wentBack = new Promise((resolve) => window.addEventListener('popstate', resolve, { once: true }))
        history.back()
        await wentBack

        await expect.poll(() => screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(location.href).toBe(address)
    })

    // Going back closes what's on top, as Escape does, rather than the details under a price's modal
    test('should close only a price modal opened from the details on going back', async () => {
        const user = userEvent.setup()
        renderProduct()
        const details = await openDetails()
        // Under the price list, once the prices have loaded
        await user.click(await within(details).findByRole('button', { name: 'Add Price' }))
        await screen.findByRole('dialog', { name: 'Add Price' })
        expect(history.state).toMatchObject({ closeOnBackEntry: expect.any(Number) })

        const wentBack = new Promise((resolve) => window.addEventListener('popstate', resolve, { once: true }))
        history.back()
        await wentBack

        await expect.poll(() => screen.queryByRole('dialog', { name: 'Add Price' })).not.toBeInTheDocument()
        expect(details).toBeVisible()
    })

    // A closed row kept its time range, and the details keep it the same way until the page reloads
    test('should keep the time range when the details are closed and opened again', async () => {
        const user = userEvent.setup()
        renderProduct()
        // On the chart, once the prices have loaded
        await user.click(await within(await openDetails()).findByText('All'))
        await user.click(screen.getByRole('button', { name: 'Close details' }))

        const dialog = await openDetails()

        expect(within(dialog).getByRole('radio', { name: 'All' })).toBeChecked()
    })

    // Both come from the product's whole price history, so a shorter time range doesn't change them
    test('should keep the average price and sparkle when the time range changes', async ({ worker }) => {
        const cheapOldPrice = createPrice(3, { totalAmount: 1, priceStarted: new Date(2020, 0, 1, 12).toISOString() })
        worker.use(
            http.get(import.meta.env.VITE_BACKEND_ROOT_URL + '/prices/product/:productId', ({ request }) => {
                const isAll = !new URL(request.url).searchParams.has('startDate')
                return HttpResponse.json(isAll ? [price1, cheapOldPrice] : [price1])
            })
        )
        const user = userEvent.setup()
        renderProduct({ ...productBody, averagePrice: 15, weightedAveragePrice: 17.5, belowAverage: true })
        const dialog = await openDetails()
        await expect.poll(() => priceListColumn()?.textContent).toContain('Average $15.00')

        await user.click(within(dialog).getByText('All'))
        // The old price only arrives with the All range, so seeing its row means the new range's prices have loaded,
        // and the checks below aren't made against the old range
        await within(dialog).findByText('Jan 1, 2020')

        expect(priceListColumn()).toHaveTextContent('Average $15.00')
        expect(within(rowButton()).getByRole('img', { name: 'Below average price' })).toBeInTheDocument()
    })

    // The details cover the row, and its actions menu with it
    test("should offer the product's actions in the details' header", async () => {
        const user = userEvent.setup()
        renderProduct()
        const dialog = await openDetails()

        await user.click(within(dialog).getByRole('button', { name: 'Product actions' }))

        expect(await screen.findByRole('menuitem', { name: 'Edit' })).toBeInTheDocument()
    })

    // A button or link inside the row's own button is invalid HTML, and can't be reached properly with the keyboard
    test("should keep buttons and links out of the row's button", async () => {
        renderProduct()

        expect(rowButton().querySelectorAll('button, a, [role="button"]')).toHaveLength(0)
    })

    // The actions button sits beside the row's button, so opening its menu shouldn't count as a click on the row
    test('should keep the details closed when the actions menu is opened', async () => {
        const user = userEvent.setup()
        renderProduct()

        await user.click(screen.getByRole('button', { name: 'Product actions' }))
        await screen.findByRole('menu')

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    describe('actions button visibility', () => {
        /**
         * Get the actions button in the product's row, rather than the one in the details' header.
         * @returns The row's actions button
         */
        const rowActionsButton = () =>
            within(rowButton().parentElement!).getByRole('button', { name: 'Product actions' })

        // The button's opacity once any fade has finished
        const actionsOpacity = () => expect.poll(() => getComputedStyle(rowActionsButton()).opacity)

        // Faint rather than hidden, so it's still clear each row has actions
        test('should show the actions button faintly while the row is closed and not hovered', async () => {
            renderProduct()

            await actionsOpacity().toBe('0.3')
        })

        // Moves the real mouse, since CSS :hover only follows the real pointer, not the events userEvent sends. The
        // mouse stays put between tests, so it's moved off the row before the row is removed, even if the check fails
        test('should show the actions button fully while the row is hovered', async () => {
            renderProduct()
            const name = within(rowButton()).getByText('Product 1')

            await pointer.hover(name)
            try {
                await actionsOpacity().toBe('1')
            } finally {
                await pointer.unhover(name)
            }
        })

        test("should show the actions button fully while the row's details are open", async () => {
            renderProduct()
            await openDetails()

            await actionsOpacity().toBe('1')
        })

        // Tab can reach a faint button, so it has to show fully once it has focus
        test('should show the actions button fully when Tab reaches it', async () => {
            const user = userEvent.setup()
            renderProduct()

            await user.tab()
            await user.tab()

            expect(document.activeElement).toBe(rowActionsButton())
            await actionsOpacity().toBe('1')
        })

        test('should keep the actions button showing fully while its menu is open', async () => {
            const user = userEvent.setup()
            renderProduct()

            await user.click(rowActionsButton())
            // Moving into the menu leaves the row, which is drawn apart from it
            await user.hover(await screen.findByRole('menu'))

            await actionsOpacity().toBe('1')
        })
    })
})
