import { describe, expect, onTestFinished } from 'vitest'
import { RenderClientWrapper, render, screen, test, userEvent } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import { notifications, Notifications } from '@mantine/notifications'
import { EditPriceModal } from '@/components/price/modals/EditPriceModal'
import type { PriceType } from '@/types/price'
import { createQueryClient } from './queryClientUtils'

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
    createdAt: '2026-09-04T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z',
    productId: 0,
    today: false,
    deletedAt: null
}

describe('createQueryClient', () => {
    // One modal is enough because every save goes through the query client's handler
    test('should show the error notification when a save is rejected', async ({ worker }) => {
        // Notifications are shared across tests, so this one can't carry over into others
        onTestFinished(() => notifications.clean())
        worker.use(http.put(pricesApiUrl + '/:priceId', () => HttpResponse.text('Price is invalid', { status: 400 })))
        const user = userEvent.setup()
        const queryClient = createQueryClient()
        render(
            <RenderClientWrapper queryClient={queryClient}>
                <Notifications />
                <EditPriceModal price={price} closeEditPrice={() => {}} opened />
            </RenderClientWrapper>
        )

        await user.click(await screen.findByRole('button', { name: 'Edit Price' }))

        await expect.element(await screen.findByText('Price is invalid')).toBeInTheDocument()
    })
})
