import { describe, expect, vi } from 'vitest'
import { renderWithClient, screen, test, userEvent, waitFor } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import DeleteProductModal from './DeleteProductModal'
import type { ProductType } from '@/types/product'

const product: ProductType = {
    active: true,
    productId: 1,
    name: 'Product 1',
    link: '',
    store: 'Store 1',
    createdAt: '',
    updatedAt: '',
    prices: [],
    deletedAt: null
}

const productsApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/products'

describe('Delete Product Modal Component', () => {
    test('should show the delete in progress and close once it succeeds', async ({ worker }) => {
        let finishDelete = () => {}
        const deleteFinished = new Promise<void>((resolve) => (finishDelete = resolve))
        worker.use(
            http.delete(productsApiUrl + '/:productId', async () => {
                await deleteFinished
                return HttpResponse.json(product)
            })
        )
        const closeDeleteProduct = vi.fn()
        const user = userEvent.setup()
        renderWithClient(<DeleteProductModal product={product} closeDeleteProduct={closeDeleteProduct} opened />)

        const submitButton = screen.getByRole('button', { name: 'Delete Product' })
        await user.click(submitButton)

        await waitFor(() => expect(submitButton).toBeDisabled())
        expect(closeDeleteProduct).not.toHaveBeenCalled()

        finishDelete()

        await waitFor(() => expect(closeDeleteProduct).toHaveBeenCalledOnce())
    })

    test('should stay open when the delete is rejected', async ({ worker }) => {
        let deleteRejected = false
        worker.use(
            http.delete(productsApiUrl + '/:productId', () => {
                deleteRejected = true
                return HttpResponse.text('Product not found', { status: 404 })
            })
        )
        const closeDeleteProduct = vi.fn()
        const user = userEvent.setup()
        renderWithClient(<DeleteProductModal product={product} closeDeleteProduct={closeDeleteProduct} opened />)

        const submitButton = screen.getByRole('button', { name: 'Delete Product' })
        await user.click(submitButton)

        await waitFor(() => expect(deleteRejected).toBe(true))
        await waitFor(() => expect(submitButton).toBeEnabled())
        expect(closeDeleteProduct).not.toHaveBeenCalled()
    })
})
