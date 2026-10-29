import { describe, expect } from 'vitest'
import { renderWithClient, screen, test, userEvent, waitFor } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import type { ProductType } from '@/types/product'
import { ProductTitleDetails } from './ProductTitleDetails'

const productsApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/products'

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

        const deleteProductButton = screen.getByRole('img', { name: /delete product/i })
        await expect.element(deleteProductButton).toBeInTheDocument()
    })

    test('should not render product delete button', async () => {
        renderWithClient(<ProductTitleDetails product={deletedProduct} />)

        const deleteProductButton = screen.queryByRole('img', { name: /delete product/i })
        await expect.element(deleteProductButton).not.toBeInTheDocument()
    })

    test('should not render product restore button', async () => {
        renderWithClient(<ProductTitleDetails product={product} />)

        const restoreProductButton = screen.queryByRole('img', { name: /restore product/i })
        await expect.element(restoreProductButton).not.toBeInTheDocument()
    })

    test('should restore a deleted product', async ({ worker }) => {
        const restoredProductIds: string[] = []
        worker.use(
            http.put(productsApiUrl + '/:productId/restore', ({ params }) => {
                restoredProductIds.push(params.productId as string)
                return HttpResponse.json({ ...deletedProduct, deletedAt: null })
            })
        )
        const user = userEvent.setup()
        renderWithClient(<ProductTitleDetails product={deletedProduct} />)

        await user.click(screen.getByRole('img', { name: /restore product/i }))

        await waitFor(() => expect(restoredProductIds).toEqual(['0']))
    })

    test('should strike through and gray out the name and store of a deleted product', async () => {
        renderWithClient(<ProductTitleDetails product={{ ...deletedProduct, store: 'Store 1' }} />)

        await expect.element(screen.getByText('Product 1')).toHaveClass('line-through', 'text-raincloud')
        await expect.element(screen.getByText('Store 1')).toHaveClass('line-through', 'text-raincloud')
    })

    test('should not strike through the name and store of a product', async () => {
        renderWithClient(<ProductTitleDetails product={{ ...product, store: 'Store 1' }} />)

        await expect.element(screen.getByText('Product 1')).not.toHaveClass('line-through')
        await expect.element(screen.getByText('Store 1')).not.toHaveClass('line-through')
    })
})
