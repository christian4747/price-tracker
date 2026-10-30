import { describe, expect, onTestFinished, vi } from 'vitest'
import {
    modalCloseActions,
    renderWithClient,
    screen,
    test,
    tryEveryModalCloseAction,
    userEvent,
    waitFor
} from '@/test-utils'
import { http, HttpResponse } from 'msw'
import type { PriceType } from '@/types/price'
import { EditPriceModal } from './EditPriceModal'

const pricesApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/prices'

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
    // Built from local times so the expected text doesn't depend on the test machine's time zone
    createdAt: new Date(2026, 8, 4, 14, 5).toISOString(),
    updatedAt: new Date(2026, 8, 6, 9, 30).toISOString(),
    productId: 0,
    today: false,
    deletedAt: null
}

describe('Edit Price Modal Component', () => {
    test('should show when the price was added and last updated', async () => {
        renderWithClient(<EditPriceModal price={price} closeEditPrice={() => {}} opened />)

        await expect.element(await screen.findByText('Added Sep 4, 2026 2:05 PM')).toBeVisible()
        await expect.element(screen.getByText('Last updated Sep 6, 2026 9:30 AM')).toBeVisible()
        // The dates stay out of the title so the header's close button keeps its place
        await expect.element(screen.getByRole('heading', { name: 'Edit Price' })).toBeInTheDocument()
    })

    test('should ignore closing while the save is in progress', async ({ worker }) => {
        let finishSave = () => {}
        const saveFinished = new Promise<void>((resolve) => (finishSave = resolve))
        // Ends mid-save, so still let the request finish
        onTestFinished(() => finishSave())
        worker.use(
            http.put(pricesApiUrl + '/:priceId', async () => {
                await saveFinished
                return HttpResponse.json(price)
            })
        )
        const closeEditPrice = vi.fn()
        const user = userEvent.setup()
        renderWithClient(<EditPriceModal price={price} closeEditPrice={closeEditPrice} opened />)

        const submitButton = screen.getByRole('button', { name: 'Edit Price' })
        await user.click(submitButton)
        await waitFor(() => expect(submitButton).toBeDisabled())

        await tryEveryModalCloseAction(user)

        expect(closeEditPrice).not.toHaveBeenCalled()
    })

    test('should close after the save is rejected', async ({ worker }) => {
        let saveRejected = false
        worker.use(
            http.put(pricesApiUrl + '/:priceId', () => {
                saveRejected = true
                return HttpResponse.text('Price is invalid', { status: 400 })
            })
        )
        const closeEditPrice = vi.fn()
        const user = userEvent.setup()
        renderWithClient(<EditPriceModal price={price} closeEditPrice={closeEditPrice} opened />)

        const submitButton = screen.getByRole('button', { name: 'Edit Price' })
        await user.click(submitButton)
        await waitFor(() => expect(saveRejected).toBe(true))
        await waitFor(() => expect(submitButton).toBeEnabled())

        await modalCloseActions.closeButton(user)

        expect(closeEditPrice).toHaveBeenCalledOnce()
    })
})
