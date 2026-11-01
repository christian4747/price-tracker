// Imported from its own file because test-utils/index.ts leads back to these handlers
import { createPrice } from '@/test-utils/createPrice'
import { http, HttpResponse } from 'msw'

const rootUrl = import.meta.env.VITE_BACKEND_ROOT_URL
const productsApiUrl = rootUrl + '/products'
const pricesApiUrl = rootUrl + '/prices'

const price1 = createPrice(1)
const price2 = createPrice(2, { priceStarted: new Date(2026, 8, 5, 12).toISOString() })

export const handlers = [
    http.get(productsApiUrl, () => {
        return HttpResponse.json({
            content: [
                {
                    productId: 1,
                    brand: null,
                    name: 'Product 1',
                    link: '',
                    store: 'Store 1',
                    active: true,
                    createdAt: new Date(2026, 7, 31, 12).toISOString(),
                    updatedAt: new Date(2026, 7, 31, 12).toISOString(),
                    prices: []
                }
            ],
            count: 1
        })
    }),

    http.get(productsApiUrl + '/recent/stores', () => {
        return HttpResponse.json([])
    }),

    http.get(pricesApiUrl + '/recent/:productId', () => {
        return HttpResponse.json({
            baseAmounts: [],
            currencies: [],
            descriptions: [],
            discountPercentages: [],
            pricesStarted: [],
            pricesEnded: [],
            returnPercentages: []
        })
    }),

    http.get(pricesApiUrl + '/product/*', () => {
        return HttpResponse.json([price1, price2])
    })
]
