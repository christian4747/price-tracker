import { describe, expect, onTestFinished, vi } from 'vitest'
import type { SetupWorker } from 'msw/browser'
import { renderWithClient, screen, test, tryEveryModalCloseAction, userEvent, waitFor } from '@/test-utils'
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

// Renders the modal and starts a delete that stays in progress until finishDelete is called
const startDelete = async (worker: SetupWorker) => {
    let finishDelete = () => {}
    const deleteFinished = new Promise<void>((resolve) => (finishDelete = resolve))
    // Tests that end mid-delete still let the request finish
    onTestFinished(() => finishDelete())
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

    return { closeDeleteProduct, finishDelete, submitButton, user }
}

describe('Delete Product Modal Component', () => {
    test('should show the delete in progress', async ({ worker }) => {
        const { submitButton } = await startDelete(worker)

        expect(submitButton).toHaveAttribute('data-loading')
    })

    test('should ignore closing while the delete is in progress', async ({ worker }) => {
        const { closeDeleteProduct, user } = await startDelete(worker)

        await tryEveryModalCloseAction(user)

        expect(closeDeleteProduct).not.toHaveBeenCalled()
    })

    test('should close once the delete succeeds', async ({ worker }) => {
        const { closeDeleteProduct, finishDelete } = await startDelete(worker)

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
