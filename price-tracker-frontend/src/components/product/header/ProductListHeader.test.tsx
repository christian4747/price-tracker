import { describe, expect, vi } from 'vitest'
import { renderWithClient, screen, test, userEvent, waitFor, within } from '@/test-utils'
import { ProductListHeader } from './ProductListHeader'
import { ACTIVE_PRODUCTS } from '@/utils/filterConstants'
import type { ProductActiveStatus } from '@/types/product'

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
