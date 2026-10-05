import { describe, expect } from 'vitest'
import { renderWithClient, screen, test, userEvent, within } from '@/test-utils'
import { ProductListHeader } from './ProductListHeader'
import { ACTIVE_PRODUCTS } from '@/utils/FilterConstants'
import type { ProductActiveStatus } from '@/utils/Types'

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

const renderProductListHeader = (showDeleted: string = 'false') => {
    const modifiedProductFilterDTO = {
        ...productFilterDTO,
        deleted: showDeleted
    }

    return renderWithClient(
        <ProductListHeader
            searchSearchTerm={() => { } }
            productsGroupBy={''}
            setProductsGroupBy={() => { } }
            productFilterDTO={modifiedProductFilterDTO}
            setField={() => {}}
        />
    )
}

describe('Product List Header Component', () => {
    test('should render hide deleted menu button', async () => {
        renderProductListHeader()

        const hideShowDeletedButton = await screen.findByText(/hide deleted/i)
        await expect.element(hideShowDeletedButton).toBeInTheDocument()
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

    test('should render sort values after clicking menu button', async () => {
        const user = userEvent.setup()

        renderProductListHeader()

        const openSortMenuButton = await screen.findByText(/sort/i)
        await user.click(openSortMenuButton)

        const sortMenu = await screen.findByRole('menu')

        const sortByName = await within(sortMenu).findByText(/name/i)
        await expect.element(sortByName).toBeInTheDocument()

        const sortByBrand = await within(sortMenu).findByText(/brand/i)
        await expect.element(sortByBrand).toBeInTheDocument()

        const sortByStore = await within(sortMenu).findByText(/store/i)
        await expect.element(sortByStore).toBeInTheDocument()

        const sortByUpdatedAt = await within(sortMenu).findByText(/last updated/i)
        await expect.element(sortByUpdatedAt).toBeInTheDocument()

        const sortByCurrentPrice = await within(sortMenu).findByText(/current price/i)
        await expect.element(sortByCurrentPrice).toBeInTheDocument()

        const sortByCurrentDiscount = await within(sortMenu).findByText(/current discount/i)
        await expect.element(sortByCurrentDiscount).toBeInTheDocument()

        const ascendingSwitch = await within(sortMenu).findByText(/ascending/i)
        await expect.element(ascendingSwitch).toBeInTheDocument()
    })
})