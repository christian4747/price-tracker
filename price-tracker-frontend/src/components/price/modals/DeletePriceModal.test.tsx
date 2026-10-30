import { describe, expect, onTestFinished, vi } from 'vitest'
import type { SetupWorker } from 'msw/browser'
import { renderWithClient, screen, test, tryEveryModalCloseAction, userEvent, waitFor } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import { DeletePriceModal } from './DeletePriceModal'
import type { PriceType } from '@/types/price'

const price: PriceType = {
    priceId: 1,
    amount: 100.0,
    currency: '',
    description: '',
    discountAmount: 0.0,
    discountPercentage: 0.0,
    priceStarted: '2026-09-04T00:00:00.000Z',
    priceEnded: '',
    returnAmount: 0.0,
    returnPercentage: 0.0,
    totalAmount: 0.0,
    totalPercentage: 0.0,
    createdAt: '2026-09-04T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z',
    productId: 0,
    today: false,
    deletedAt: null
}

const pricesApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/prices'

// Renders the modal and starts a delete that stays in progress until finishDelete is called
const startDelete = async (worker: SetupWorker) => {
    let finishDelete = () => {}
    const deleteFinished = new Promise<void>((resolve) => (finishDelete = resolve))
    // Tests that end mid-delete still let the request finish
    onTestFinished(() => finishDelete())
    worker.use(
        http.delete(pricesApiUrl + '/:priceId', async () => {
            await deleteFinished
            return HttpResponse.json(price)
        })
    )
    const closeDeletePrice = vi.fn()
    const user = userEvent.setup()
    renderWithClient(<DeletePriceModal price={price} closeDeletePrice={closeDeletePrice} opened />)

    const submitButton = screen.getByRole('button', { name: 'Delete Price' })
    await user.click(submitButton)
    await waitFor(() => expect(submitButton).toBeDisabled())

    return { closeDeletePrice, finishDelete, submitButton, user }
}

describe('Delete Price Modal Component', () => {
    test('should show the delete in progress', async ({ worker }) => {
        const { submitButton } = await startDelete(worker)

        expect(submitButton).toHaveAttribute('data-loading')
    })

    test('should ignore closing while the delete is in progress', async ({ worker }) => {
        const { closeDeletePrice, user } = await startDelete(worker)

        await tryEveryModalCloseAction(user)

        expect(closeDeletePrice).not.toHaveBeenCalled()
    })

    test('should close once the delete succeeds', async ({ worker }) => {
        const { closeDeletePrice, finishDelete } = await startDelete(worker)

        finishDelete()

        await waitFor(() => expect(closeDeletePrice).toHaveBeenCalledOnce())
    })

    test('should stay open when the delete is rejected', async ({ worker }) => {
        let deleteRejected = false
        worker.use(
            http.delete(pricesApiUrl + '/:priceId', () => {
                deleteRejected = true
                return HttpResponse.text('Price not found', { status: 404 })
            })
        )
        const closeDeletePrice = vi.fn()
        const user = userEvent.setup()
        renderWithClient(<DeletePriceModal price={price} closeDeletePrice={closeDeletePrice} opened />)

        const submitButton = screen.getByRole('button', { name: 'Delete Price' })
        await user.click(submitButton)

        await waitFor(() => expect(deleteRejected).toBe(true))
        await waitFor(() => expect(submitButton).toBeEnabled())
        expect(closeDeletePrice).not.toHaveBeenCalled()
    })
})
