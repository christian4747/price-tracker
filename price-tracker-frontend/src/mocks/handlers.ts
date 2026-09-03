import { http, HttpResponse } from 'msw'

const rootUrl = import.meta.env.VITE_BACKEND_ROOT_URL
const productsApiUrl = rootUrl + '/products'
const pricesApiUrl = rootUrl + '/prices'

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
    })
]