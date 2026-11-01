import { describe, expect, onTestFinished, vi } from 'vitest'
import type { SetupWorker } from 'msw/browser'
import { act, renderWithClient, screen, test, tryEveryModalCloseAction, userEvent, waitFor } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import { notifications } from '@mantine/notifications'
import { PermanentlyDeleteProductModal } from './PermanentlyDeleteProductModal'
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
    deletedAt: new Date(2026, 8, 6, 12).toISOString()
}

const productsApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/products'
const pricesApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/prices'

// Renders the modal for a product with the given number of prices, and returns the name input and submit button
const renderModal = async (worker: SetupWorker, priceCount = 2, closeModal = () => {}) => {
    worker.use(http.get(pricesApiUrl + '/product/:productId/count', () => HttpResponse.json(priceCount)))
    renderWithClient(<PermanentlyDeleteProductModal product={product} closeModal={closeModal} opened />)

    return {
        nameInput: screen.getByRole('textbox', { name: /type the product's name to confirm/i }),
        submitButton: screen.getByRole('button', { name: 'Permanently Delete Product' })
    }
}

// Renders the modal and starts a delete that stays in progress until finishDelete is called
const startDelete = async (worker: SetupWorker) => {
    let finishDelete = () => {}
    const deleteFinished = new Promise<void>((resolve) => (finishDelete = resolve))
    // Tests that end mid-delete still let the request finish
    onTestFinished(() => finishDelete())
    worker.use(
        http.delete(productsApiUrl + '/:productId/permanent', async () => {
            await deleteFinished
            return HttpResponse.json(product)
        })
    )
    const closeModal = vi.fn()
    const user = userEvent.setup()
    const { nameInput, submitButton } = await renderModal(worker, 2, closeModal)

    await user.type(nameInput, 'Product 1')
    await waitFor(() => expect(submitButton).toBeEnabled())
    await user.click(submitButton)
    await waitFor(() => expect(submitButton).toBeDisabled())

    return { closeModal, finishDelete, submitButton, user }
}

describe('Permanently Delete Product Modal Component', () => {
    test('should show the product, its store and that it cannot be undone', async ({ worker }) => {
        await renderModal(worker)

        await expect.element(screen.getByText(/permanently delete product product 1/i)).toBeInTheDocument()
        await expect.element(screen.getByText(/store 1/i)).toBeInTheDocument()
        await expect.element(screen.getByText(/can't be undone/i)).toBeInTheDocument()
    })

    test.for([
        [2, 'This also permanently deletes its 2 prices.'],
        [1, 'This also permanently deletes its 1 price.'],
        [0, 'This product has no prices.']
    ] as const)('should show how many prices will be deleted for %s', async ([priceCount, message], { worker }) => {
        await renderModal(worker, priceCount)

        await expect.element(await screen.findByText(new RegExp(message))).toBeInTheDocument()
    })

    test('should keep the button disabled until the typed name matches', async ({ worker }) => {
        const user = userEvent.setup()
        const { nameInput, submitButton } = await renderModal(worker)
        await screen.findByText(/this also permanently deletes/i)

        expect(submitButton).toBeDisabled()

        await user.type(nameInput, 'Product')
        expect(submitButton).toBeDisabled()

        await user.clear(nameInput)
        await user.type(nameInput, 'product 1')
        expect(submitButton).toBeDisabled()

        await user.clear(nameInput)
        await user.type(nameInput, 'Product 1')
        expect(submitButton).toBeEnabled()
    })

    test('should keep the button disabled until the price count has loaded', async ({ worker }) => {
        let finishCount = () => {}
        const countFinished = new Promise<void>((resolve) => (finishCount = resolve))
        onTestFinished(() => finishCount())
        worker.use(
            http.get(pricesApiUrl + '/product/:productId/count', async () => {
                await countFinished
                return HttpResponse.json(2)
            })
        )
        const user = userEvent.setup()
        renderWithClient(<PermanentlyDeleteProductModal product={product} closeModal={() => {}} opened />)
        const submitButton = screen.getByRole('button', { name: 'Permanently Delete Product' })

        await user.type(screen.getByRole('textbox', { name: /type the product's name/i }), 'Product 1')
        expect(submitButton).toBeDisabled()

        finishCount()

        await waitFor(() => expect(submitButton).toBeEnabled())
    })

    test('should hide the saved price count and disable the button while it refreshes', async ({ worker }) => {
        let requestCount = 0
        let finishRefresh = () => {}
        const refreshFinished = new Promise<void>((resolve) => (finishRefresh = resolve))
        onTestFinished(() => finishRefresh())
        worker.use(
            http.get(pricesApiUrl + '/product/:productId/count', async () => {
                requestCount++
                if (requestCount === 1) return HttpResponse.json(3)

                await refreshFinished
                return HttpResponse.json(2)
            })
        )
        const user = userEvent.setup()
        const { queryClient } = renderWithClient(
            <PermanentlyDeleteProductModal product={product} closeModal={() => {}} opened />
        )
        const submitButton = screen.getByRole('button', { name: 'Permanently Delete Product' })

        await screen.findByText('This also permanently deletes its 3 prices.')
        await user.type(screen.getByRole('textbox', { name: /type the product's name/i }), 'Product 1')
        expect(submitButton).toBeEnabled()

        act(() => {
            queryClient.invalidateQueries()
        })

        await waitFor(() => expect(requestCount).toBe(2))
        await waitFor(() => expect(submitButton).toBeDisabled())
        expect(screen.queryByText('This also permanently deletes its 3 prices.')).not.toBeInTheDocument()

        finishRefresh()

        await screen.findByText('This also permanently deletes its 2 prices.')
        expect(submitButton).toBeEnabled()
    })

    test('should not load the price count until the modal is opened', async ({ worker }) => {
        let countRequests = 0
        worker.use(
            http.get(pricesApiUrl + '/product/:productId/count', () => {
                countRequests++
                return HttpResponse.json(2)
            })
        )
        const { rerender } = renderWithClient(
            <PermanentlyDeleteProductModal product={product} closeModal={() => {}} opened={false} />
        )

        expect(countRequests).toBe(0)

        rerender(<PermanentlyDeleteProductModal product={product} closeModal={() => {}} opened />)

        await waitFor(() => expect(countRequests).toBe(1))
    })

    test('should clear the typed name when closed', async ({ worker }) => {
        const closeModal = vi.fn()
        const user = userEvent.setup()
        const { nameInput } = await renderModal(worker, 2, closeModal)

        await user.type(nameInput, 'Product 1')
        await user.click(document.querySelector('.mantine-Modal-close')!)

        expect(closeModal).toHaveBeenCalledOnce()
        expect((nameInput as HTMLInputElement).value).toBe('')
    })

    test('should send the delete to the permanent endpoint for the product', async ({ worker }) => {
        const deletedProductIds: string[] = []
        let softDeleteRequests = 0
        worker.use(
            http.delete(productsApiUrl + '/:productId/permanent', ({ params }) => {
                deletedProductIds.push(params.productId as string)
                return HttpResponse.json(product)
            }),
            http.delete(productsApiUrl + '/:productId', () => {
                softDeleteRequests++
                return HttpResponse.json(product)
            })
        )
        const user = userEvent.setup()
        const { nameInput, submitButton } = await renderModal(worker)

        await user.type(nameInput, 'Product 1')
        await waitFor(() => expect(submitButton).toBeEnabled())
        await user.click(submitButton)

        await waitFor(() => expect(deletedProductIds).toEqual(['1']))
        expect(softDeleteRequests).toBe(0)
    })

    test('should notify which product was deleted', async ({ worker }) => {
        const show = vi.spyOn(notifications, 'show')
        onTestFinished(() => show.mockRestore())
        const { finishDelete } = await startDelete(worker)

        finishDelete()

        await waitFor(() =>
            expect(show).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Successfully permanently deleted product Product 1' })
            )
        )
    })

    test('should show the delete in progress', async ({ worker }) => {
        const { submitButton } = await startDelete(worker)

        expect(submitButton).toHaveAttribute('data-loading')
    })

    test('should ignore closing while the delete is in progress', async ({ worker }) => {
        const { closeModal, user } = await startDelete(worker)

        await tryEveryModalCloseAction(user)

        expect(closeModal).not.toHaveBeenCalled()
    })

    test('should close once the delete succeeds', async ({ worker }) => {
        const { closeModal, finishDelete } = await startDelete(worker)

        finishDelete()

        await waitFor(() => expect(closeModal).toHaveBeenCalledOnce())
    })

    test('should stay open when the delete is rejected', async ({ worker }) => {
        let deleteRejected = false
        worker.use(
            http.delete(productsApiUrl + '/:productId/permanent', () => {
                deleteRejected = true
                return HttpResponse.text('Only deleted products can be permanently deleted!', { status: 400 })
            })
        )
        const closeModal = vi.fn()
        const user = userEvent.setup()
        const { nameInput, submitButton } = await renderModal(worker, 2, closeModal)

        await user.type(nameInput, 'Product 1')
        await waitFor(() => expect(submitButton).toBeEnabled())
        await user.click(submitButton)

        await waitFor(() => expect(deleteRejected).toBe(true))
        await waitFor(() => expect(submitButton).toBeEnabled())
        expect(closeModal).not.toHaveBeenCalled()
    })
})
