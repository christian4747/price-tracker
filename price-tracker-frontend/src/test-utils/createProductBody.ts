import type { ProductBody, ProductType } from '@/types/product'

// Creates a test product body for the given product, where changes replace only the values a test depends on
export const createProductBody = (product: ProductType, changes: Partial<ProductBody> = {}): ProductBody => ({
    product,
    priceToday: undefined,
    nextPrice: undefined,
    priceCategory: '',
    lastUpdated: new Date(2026, 8, 4, 12).toISOString(),
    averagePrice: null,
    weightedAveragePrice: null,
    belowAverage: false,
    ...changes
})
