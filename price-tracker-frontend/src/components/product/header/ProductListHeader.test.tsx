import { afterEach, beforeEach, describe, expect, vi } from 'vitest'
import { page } from 'vitest/browser'
import { renderWithClient, screen, test, userEvent, waitFor, within } from '@/test-utils'
import { ProductListHeader } from './ProductListHeader'
import { ACTIVE_PRODUCTS } from '@/utils/filterConstants'
import type { ProductActiveStatus } from '@/types/product'
// The layout tests measure the toolbar, so they need the app's styles
import '@/styles/index.css'

const productFilterDTO = {
    brand: '',
    name: '',
    store: '',
    active: ACTIVE_PRODUCTS as ProductActiveStatus,
    startUpdatedAt: '',
    endUpdatedAt: '',
    startCreatedAt: '',
    endCreatedAt: '',
    deleted: 'false',
    startDeletedAt: '',
    endDeletedAt: ''
}

const renderProductListHeader = (
    showDeleted: string = 'false',
    searchSearchTerm: (searchTerm: string) => void = () => {},
    { productsGroupBy = '', setField = () => {} }: { productsGroupBy?: string; setField?: () => void } = {}
) => {
    const modifiedProductFilterDTO = {
        ...productFilterDTO,
        deleted: showDeleted
    }

    return renderWithClient(
        <ProductListHeader
            searchSearchTerm={searchSearchTerm}
            productsGroupBy={productsGroupBy}
            setProductsGroupBy={() => {}}
            productFilterDTO={modifiedProductFilterDTO}
            setField={setField}
        />
    )
}

// The plain list, and the grouped list grouped by name
const lists = [
    { list: 'plain', productsGroupBy: '' },
    { list: 'grouped', productsGroupBy: 'name' }
]

/**
 * Render the header inside a page of the given width, at a browser size that gives the app's root font for it.
 * @param viewportWidth The browser's width; above 1024 px the root font is 18 px, and 16 px below
 * @param pageWidth The width of the page's content, which the toolbar has to fit inside
 * @returns The page element, to measure the toolbar against
 */
const renderHeaderAtWidth = async (viewportWidth: number, pageWidth: number) => {
    await page.viewport(viewportWidth, 900)
    renderWithClient(
        <div data-testid="page" style={{ width: pageWidth }}>
            <ProductListHeader
                searchSearchTerm={() => {}}
                productsGroupBy=""
                setProductsGroupBy={() => {}}
                productFilterDTO={productFilterDTO}
                setField={() => {}}
            />
        </div>
    )
    return screen.getByTestId('page')
}

/**
 * Get the toolbar's buttons, from Active on the left to Add Product on the right.
 * @returns The buttons
 */
const toolbarButtons = () =>
    ['Active', 'Group By', 'Hide Deleted', 'Sort', 'Periods', 'Add Product'].map((name) =>
        screen.getByRole('button', { name })
    )

describe('Product List Header toolbar layout', () => {
    let defaultViewport = { width: 0, height: 0 }
    beforeEach(() => {
        defaultViewport = { width: window.innerWidth, height: window.innerHeight }
    })
    afterEach(async () => {
        await page.viewport(defaultViewport.width, defaultViewport.height)
    })

    // A toolbar wider than the page makes the whole page scroll sideways
    test('should keep every button inside a narrow page', async () => {
        // An 800 px window, whose page is 785 px wide beside the scrollbar, narrower than the toolbar's one line
        const pageBox = (await renderHeaderAtWidth(800, 785)).getBoundingClientRect()

        for (const button of toolbarButtons()) {
            const box = button.getBoundingClientRect()
            expect(box.right, `${button.textContent} ends at ${box.right} px`).toBeLessThanOrEqual(pageBox.right)
        }
    })

    // Below desktop width the left buttons are only as wide as their labels, so one row holds down to about a 856 px
    // window, where buttons 120 px wide each would wrap below about 965 px. 900 px is between the two.
    test('should keep the toolbar on one line on a 900 px window', async () => {
        // 885 px of page beside the scrollbar
        await renderHeaderAtWidth(900, 885)

        const tops = new Set(toolbarButtons().map((button) => Math.round(button.getBoundingClientRect().top)))
        expect(tops.size).toBe(1)
    })

    // Wrapping is only for narrow windows: with room to spare, the toolbar stays one row
    test('should keep the toolbar on one line on a desktop page', async () => {
        // The page's content is 1126 px wide at most, on any window wider than that
        await renderHeaderAtWidth(1280, 1126)

        const tops = new Set(toolbarButtons().map((button) => Math.round(button.getBoundingClientRect().top)))
        expect(tops.size).toBe(1)
    })

    // Add Product had a margin of its own, which put it further from Periods than the other buttons are apart
    test('should space Add Product from Periods like the other buttons', async () => {
        await renderHeaderAtWidth(1280, 1126)
        const [active, groupBy, , , periods, addProduct] = toolbarButtons().map((button) =>
            button.getBoundingClientRect()
        )

        const gap = groupBy.left - active.right
        expect(addProduct.left - periods.right).toBeCloseTo(gap, 0)
        // Its top lines up with the others too, without the margin pushing it down
        expect(addProduct.top).toBeCloseTo(periods.top, 0)
    })
})

describe('Product List Header Component', () => {
    test('should render hide deleted menu button', async () => {
        renderProductListHeader()

        const hideShowDeletedButton = await screen.findByText(/hide deleted/i)
        await expect.element(hideShowDeletedButton).toBeInTheDocument()
    })

    test('should render the Periods button beside Add Product', async () => {
        renderProductListHeader()

        const periodsButton = screen.getByRole('button', { name: 'Periods' })
        const addProductButton = screen.getByRole('button', { name: 'Add Product' })
        expect(periodsButton.compareDocumentPosition(addProductButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    test('should render hide/show delete menu button', async () => {
        renderProductListHeader('true')

        const hideShowDeletedButton = await screen.findByText(/show deleted/i)
        await expect.element(hideShowDeletedButton).toBeInTheDocument()
    })

    test('should render sort menu button', async () => {
        renderProductListHeader()

        const sortMenuButton = await screen.findByText(/sort/i)
        await expect.element(sortMenuButton).toBeInTheDocument()
    })

    test.for(lists)(
        'should render sort values after clicking menu button on the $list list',
        async ({ productsGroupBy }) => {
            const user = userEvent.setup()

            renderProductListHeader('false', () => {}, { productsGroupBy })

            const openSortMenuButton = await screen.findByText(/sort/i)
            await user.click(openSortMenuButton)

            const sortMenu = await screen.findByRole('menu')

            const sortByName = await within(sortMenu).findByText(/name/i)
            await expect.element(sortByName).toBeInTheDocument()

            const sortByBrand = await within(sortMenu).findByText(/brand/i)
            await expect.element(sortByBrand).toBeInTheDocument()

            const sortByStore = await within(sortMenu).findByText(/store/i)
            await expect.element(sortByStore).toBeInTheDocument()

            const sortByCreatedAt = await within(sortMenu).findByText(/date added/i)
            await expect.element(sortByCreatedAt).toBeInTheDocument()

            const sortByUpdatedAt = await within(sortMenu).findByText(/last updated/i)
            await expect.element(sortByUpdatedAt).toBeInTheDocument()

            const sortByCurrentPrice = await within(sortMenu).findByText(/current price/i)
            await expect.element(sortByCurrentPrice).toBeInTheDocument()

            const sortByCurrentDiscount = await within(sortMenu).findByText(/current discount/i)
            await expect.element(sortByCurrentDiscount).toBeInTheDocument()

            const sortByTimeRemaining = await within(sortMenu).findByText(/time remaining/i)
            await expect.element(sortByTimeRemaining).toBeInTheDocument()

            const ascendingSwitch = await within(sortMenu).findByText(/ascending/i)
            await expect.element(ascendingSwitch).toBeInTheDocument()
        }
    )

    test.for(lists)('should sort by the chosen option on the $list list', async ({ productsGroupBy }) => {
        const user = userEvent.setup()
        const setField = vi.fn()
        renderProductListHeader('false', () => {}, { productsGroupBy, setField })

        await user.click(await screen.findByText(/sort/i))
        await user.click(await within(await screen.findByRole('menu')).findByText('Current Price'))

        expect(setField).toHaveBeenCalledWith('sort', 'currentPrice,asc')
    })

    test('should search once typing stops', async () => {
        const user = userEvent.setup()
        const searchSearchTerm = vi.fn()
        renderProductListHeader('false', searchSearchTerm)

        await user.type(screen.getByPlaceholderText('Search'), 'milk')

        await waitFor(() => expect(searchSearchTerm).toHaveBeenCalledWith('milk'))
        expect(searchSearchTerm).toHaveBeenCalledTimes(1)
    })

    test('should search the typed text immediately when the search icon is clicked', async () => {
        const user = userEvent.setup()
        const searchSearchTerm = vi.fn()
        renderProductListHeader('false', searchSearchTerm)

        await user.type(screen.getByPlaceholderText('Search'), 'milk')
        await user.click(screen.getByRole('button', { name: 'Search' }))

        expect(searchSearchTerm).toHaveBeenCalledTimes(1)
        expect(searchSearchTerm).toHaveBeenCalledWith('milk')
    })

    // The search button comes just before the search box, so Shift+Tab from the box reaches it
    test('should reach the search button with the keyboard from the search box', async () => {
        const user = userEvent.setup()
        renderProductListHeader()

        await user.click(screen.getByPlaceholderText('Search'))
        await user.tab({ shift: true })

        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Search' }))
    })

    test('should search the typed text immediately with Enter on the search button', async () => {
        const user = userEvent.setup()
        const searchSearchTerm = vi.fn()
        renderProductListHeader('false', searchSearchTerm)

        await user.type(screen.getByPlaceholderText('Search'), 'milk')
        await user.tab({ shift: true })
        await user.keyboard('{Enter}')

        expect(searchSearchTerm).toHaveBeenCalledTimes(1)
        expect(searchSearchTerm).toHaveBeenCalledWith('milk')
    })

    test('should name the search button in its tooltip', async () => {
        const user = userEvent.setup()
        renderProductListHeader()

        await user.hover(screen.getByRole('button', { name: 'Search' }))

        await expect.element(screen.getByRole('tooltip')).toHaveTextContent('Search')
    })
})
