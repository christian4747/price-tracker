// Imported from its own file because test-utils/index.ts leads back to these handlers
import { createPrice } from '@/test-utils/createPrice'
import { http, HttpResponse } from 'msw'

const rootUrl = import.meta.env.VITE_BACKEND_ROOT_URL
const productsApiUrl = rootUrl + '/products'
const pricesApiUrl = rootUrl + '/prices'

const price1 = createPrice(1)
const price2 = createPrice(2, { priceStarted: '2026-09-05T00:00:00.000Z' })

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
                    createdAt: '2026-08-31T00:00:00.000Z',
                    updatedAt: '2026-08-31T00:00:00.000Z',
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
