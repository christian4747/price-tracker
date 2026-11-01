import type { PriceType } from '@/types/price'

// Creates a test price, where changes replace only the values a test depends on
export const createPrice = (priceId: number, changes: Partial<PriceType> = {}): PriceType => ({
    priceId,
    amount: 100.0,
    currency: 'USD',
    description: '',
    discountAmount: 100.0,
    discountPercentage: 0.0,
    priceStarted: '2026-09-04T00:00:00.000Z',
    priceEnded: '',
    returnAmount: 0.0,
    returnPercentage: 0.0,
    today: false,
    totalAmount: 100.0,
    totalPercentage: 0.0,
    createdAt: '2026-09-04T00:00:00.000Z',
    deletedAt: null,
    updatedAt: '2026-09-04T00:00:00.000Z',
    productId: 1,
    ...changes
})
