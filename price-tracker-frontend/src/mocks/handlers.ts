import type { PriceType } from '@/utils/Types'
import { http, HttpResponse } from 'msw'

const rootUrl = import.meta.env.VITE_BACKEND_ROOT_URL
const productsApiUrl = rootUrl + '/products'
const pricesApiUrl = rootUrl + '/prices'

const price1: PriceType = {
    priceId: 1,
    amount: 100.0,
    currency: "",
    description: "",
    discountAmount: 0.0,
    discountPercentage: 0.0,
    priceStarted: "2026-09-04T00:00:00.000Z",
    priceEnded: "",
    returnAmount: 0.0,
    returnPercentage: 0.0,
    today: false,
    totalAmount: 0.0,
    totalPercentage: 0.0,
    createdAt: "2026-09-04T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
    productId: 0
}

const price2: PriceType = {
    priceId: 2,
    amount: 150.0,
    currency: "",
    description: "",
    discountAmount: 0.0,
    discountPercentage: 0.0,
    priceStarted: "2026-09-05T00:00:00.000Z",
    priceEnded: "",
    returnAmount: 0.0,
    returnPercentage: 0.0,
    today: false,
    totalAmount: 0.0,
    totalPercentage: 0.0,
    createdAt: "2026-09-05T00:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
    productId: 0
}


export const handlers = [
    http.get(productsApiUrl, () => {
        return HttpResponse.json({
            content: [{
                "productId": 1,
                "brand": null,
                "name": "Product 1",
                "link": "",
                "store": "Store 1",
                "active": true,
                "createdAt": "2026-08-31T00:00:00.000Z",
                "updatedAt": "2026-08-31T00:00:00.000Z",
                "prices": []
            }], count: 1
        })
    }),

    http.get(pricesApiUrl + '/recent', () => {
        return HttpResponse.json({
            "currencies": [],
            "descriptions": [],
            "pricesStarted": [],
            "pricesEnded": []
        })
    }),

    http.get(pricesApiUrl + '/product/*', () => {
        return HttpResponse.json({
            "prices": [price1, price2]
        })
    })
]