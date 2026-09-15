import { describe, expect } from 'vitest'
import { renderWithClient, screen, test } from '@/test-utils'
import { ProductListHeader } from './ProductListHeader'

const renderProductListHeader = (showDeleted: string) => {
    return renderWithClient(
        <ProductListHeader
            searchSearchTerm={() => {}}
            productStatusFilter={''}
            setProductStatusFilter={() => {}}
            productsGroupBy={''}
            setProductsGroupBy={() => {}}
            showDeleted={showDeleted}
            setShowDeleted={() => {}}
        />
    )
}

describe('Product Details Component', () => {
    test('should render hide deleted menu button', async () => {
        renderProductListHeader('Hide')

        const hideShowDeletedButton = await screen.findByText(/hide deleted/i)
        await expect.element(hideShowDeletedButton).toBeInTheDocument()
    })

    test('should render hide/show delete menu button', async () => {
        renderProductListHeader('Show')

        const hideShowDeletedButton = await screen.findByText(/show deleted/i)
        await expect.element(hideShowDeletedButton).toBeInTheDocument()
    })
})