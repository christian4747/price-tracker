import type { PriceType } from '@/types/price'

// Creates a test price shaped like the API's, where changes replace only the values a test depends on. Like the API,
// it has no product ID and a null end date unless one is given.
// Dates are built from local times so displayed text doesn't depend on the test machine's time zone
export const createPrice = (priceId: number, changes: Partial<PriceType> = {}): PriceType => ({
    priceId,
    amount: 100.0,
    currency: 'USD',
    description: '',
    discountAmount: 100.0,
    discountPercentage: 0.0,
    priceStarted: new Date(2026, 8, 4, 12).toISOString(),
    priceEnded: null,
    returnAmount: 0.0,
    returnPercentage: 0.0,
    today: false,
    totalAmount: 100.0,
    totalPercentage: 0.0,
    createdAt: new Date(2026, 8, 4, 12).toISOString(),
    deletedAt: null,
    updatedAt: new Date(2026, 8, 4, 12).toISOString(),
    ...changes
})
