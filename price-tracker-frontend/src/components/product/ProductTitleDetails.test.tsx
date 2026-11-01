import { describe, expect, vi } from 'vitest'
import { createProduct, renderWithClient, screen, test, userEvent, waitFor } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import { PermanentlyDeleteProductContext } from './ProductContext'
import { ProductTitleDetails } from './ProductTitleDetails'

const productsApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/products'

const product = createProduct(1, { name: 'Product 1' })

const deletedProduct = createProduct(1, { name: 'Product 1', deletedAt: new Date(2026, 8, 6, 12).toISOString() })

describe('Product Title Details Component', () => {
    test('should render product delete button', async () => {
        renderWithClient(<ProductTitleDetails product={product} />)

        const deleteProductButton = screen.getByRole('img', { name: /delete product/i })
        await expect.element(deleteProductButton).toBeInTheDocument()
    })

    test('should not render product delete button', async () => {
        renderWithClient(<ProductTitleDetails product={deletedProduct} />)

        const deleteProductButton = screen.queryByRole('img', { name: 'Delete product' })
        await expect.element(deleteProductButton).not.toBeInTheDocument()
    })

    test('should not render permanently delete button for a product that is not deleted', async () => {
        renderWithClient(<ProductTitleDetails product={product} />)

        expect(screen.queryByRole('img', { name: 'Permanently delete product' })).not.toBeInTheDocument()
    })

    test('should open the permanently delete modal for a deleted product', async () => {
        const openPermanentlyDeleteProductModal = vi.fn()
        const user = userEvent.setup()
        renderWithClient(
            <PermanentlyDeleteProductContext value={openPermanentlyDeleteProductModal}>
                <ProductTitleDetails product={deletedProduct} />
            </PermanentlyDeleteProductContext>
        )

        await user.click(screen.getByRole('img', { name: 'Permanently delete product' }))

        expect(openPermanentlyDeleteProductModal).toHaveBeenCalledWith(deletedProduct)
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

        await waitFor(() => expect(restoredProductIds).toEqual(['1']))
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
