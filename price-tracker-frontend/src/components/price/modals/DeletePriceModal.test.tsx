import { describe, expect, vi } from 'vitest'
import { renderWithClient, screen, test, userEvent, waitFor } from '@/test-utils'
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

describe('Delete Price Modal Component', () => {
    test('should show the delete in progress and close once it succeeds', async ({ worker }) => {
        let finishDelete = () => {}
        const deleteFinished = new Promise<void>((resolve) => (finishDelete = resolve))
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
        expect(closeDeletePrice).not.toHaveBeenCalled()

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
