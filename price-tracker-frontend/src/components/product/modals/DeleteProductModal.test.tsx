import { describe, expect, onTestFinished, vi } from 'vitest'
import type { SetupWorker } from 'msw/browser'
import {
    createProduct,
    getModalSize,
    problemDetailResponse,
    renderWithClient,
    screen,
    test,
    tryEveryModalCloseAction,
    userEvent,
    waitFor
} from '@/test-utils'
import { http, HttpResponse } from 'msw'
import DeleteProductModal from './DeleteProductModal'

const product = createProduct(1)

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
    test('should keep the default width, since it only holds a sentence and a button', async () => {
        renderWithClient(<DeleteProductModal product={product} closeDeleteProduct={() => {}} opened />)

        expect(getModalSize(await screen.findByRole('dialog'))).toBe('md')
    })

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
                return problemDetailResponse(404, 'Product not found')
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
