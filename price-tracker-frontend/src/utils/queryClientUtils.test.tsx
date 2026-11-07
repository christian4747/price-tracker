import { describe, expect, onTestFinished } from 'vitest'
import { RenderClientWrapper, createPrice, problemDetailResponse, render, screen, test, userEvent } from '@/test-utils'
import { http } from 'msw'
import { notifications, Notifications } from '@mantine/notifications'
import { EditPriceModal } from '@/components/price/modals/EditPriceModal'
import { createQueryClient } from './queryClientUtils'

const pricesApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/prices'

const price = createPrice(1)

describe('createQueryClient', () => {
    // One modal is enough because every save goes through the query client's handler
    test('should show the error notification when a save is rejected', async ({ worker }) => {
        // Notifications are shared across tests, so this one can't carry over into others
        onTestFinished(() => notifications.clean())
        worker.use(http.put(pricesApiUrl + '/:priceId', () => problemDetailResponse(400, 'Price is invalid')))
        const user = userEvent.setup()
        const queryClient = createQueryClient()
        render(
            <RenderClientWrapper queryClient={queryClient}>
                <Notifications />
                <EditPriceModal price={price} productId={1} closeEditPrice={() => {}} opened />
            </RenderClientWrapper>
        )

        await user.click(await screen.findByRole('button', { name: 'Edit Price' }))

        await expect.element(await screen.findByText('Price is invalid')).toBeInTheDocument()
    })
})
