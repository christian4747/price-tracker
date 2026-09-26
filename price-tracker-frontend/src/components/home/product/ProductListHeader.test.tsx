import { describe, expect } from 'vitest'
import { renderWithClient, screen, test } from '@/test-utils'
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

const renderProductListHeader = (showDeleted: string) => {
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
        renderProductListHeader('false')

        const hideShowDeletedButton = await screen.findByText(/hide deleted/i)
        await expect.element(hideShowDeletedButton).toBeInTheDocument()
    })

    test('should render hide/show delete menu button', async () => {
        renderProductListHeader('true')

        const hideShowDeletedButton = await screen.findByText(/show deleted/i)
        await expect.element(hideShowDeletedButton).toBeInTheDocument()
    })
})