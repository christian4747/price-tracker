import { describe, expect } from 'vitest'
import { renderWithClient, screen, test } from '@/test-utils'
import type { PriceType } from '@/types/price'
import { EditPriceModal } from './EditPriceModal'

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
})
