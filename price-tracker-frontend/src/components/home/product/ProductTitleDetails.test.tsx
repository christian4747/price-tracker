import { describe, expect } from 'vitest'
import { renderWithClient, screen, test } from '@/test-utils'
import type { ProductType } from '@/utils/Types'
import { ProductTitleDetails } from './ProductTitleDetails'

const product: ProductType = {
    active: false,
    productId: 0,
    name: 'Product 1',
    link: '',
    store: '',
    createdAt: '',
    deletedAt: null,
    updatedAt: '',
    prices: []
}

const deletedProduct: ProductType = {
    active: false,
    productId: 0,
    name: 'Product 1',
    link: '',
    store: '',
    createdAt: '',
    deletedAt: 'deleted',
    updatedAt: '',
    prices: []
}


describe('Product Title Details Component', () => {
    test('should render product delete button', async () => {
        renderWithClient(<ProductTitleDetails product={product} />)

        const deleteProductButton = screen.getByRole('img', { name: /delete product/i})
        await expect.element(deleteProductButton).toBeInTheDocument()
    })

    test('should not render product delete button', async () => {
        renderWithClient(<ProductTitleDetails product={deletedProduct} />)

        const deleteProductButton = screen.queryByRole('img', { name: /delete product/i })
        await expect.element(deleteProductButton).not.toBeInTheDocument()
    })
})