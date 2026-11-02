import type { ProductType } from '@/types/product'

// Creates a test product, where changes replace only the values a test depends on
// Dates are built from local times so displayed text doesn't depend on the test machine's time zone
export const createProduct = (productId: number, changes: Partial<ProductType> = {}): ProductType => ({
    productId,
    active: true,
    brand: null,
    name: 'Product 1',
    link: '',
    store: 'Store 1',
    createdAt: new Date(2026, 8, 4, 12).toISOString(),
    deletedAt: null,
    updatedAt: new Date(2026, 8, 4, 12).toISOString(),
    prices: [],
    ...changes
})
