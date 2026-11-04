import { describe, expect } from 'vitest'
import { createPrice, createProduct, createProductBody, renderWithClient, screen, test, userEvent } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import { ProductDetails } from './ProductDetails'

const pricesApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/prices'

const productBody = createProductBody(createProduct(1))

// Built from local times so the expected text doesn't depend on the test machine's time zone
const livePrice = createPrice(1, { priceStarted: new Date(2026, 8, 4, 12).toISOString() })
const deletedPrice = createPrice(2, {
    priceStarted: new Date(2026, 8, 5, 12).toISOString(),
    deletedAt: new Date(2026, 8, 6, 12).toISOString()
})

// Fails the first price request, then answers later ones with the live price
const failFirstPriceRequest = () => {
    let requestCount = 0
    return http.get(pricesApiUrl + '/product/:productId', () => {
        requestCount++
        return requestCount === 1
            ? HttpResponse.json({ message: 'Server error' }, { status: 500 })
            : HttpResponse.json([livePrice])
    })
}

describe('Product Details Component', () => {
    test('should render product prices', async () => {
        renderWithClient(<ProductDetails productBody={productBody} dateToday={new Date()} setDateToday={() => {}} />)

        const price1Date = await screen.findByText('9/4/2026')
        await expect.element(price1Date).toBeInTheDocument()

        const price2Date = await screen.findByText('9/5/2026')
        await expect.element(price2Date).toBeInTheDocument()
    })

    test('should still list deleted prices when they are shown', async ({ worker }) => {
        worker.use(
            http.get(pricesApiUrl + '/product/:productId', ({ request }) => {
                const showDeleted = new URL(request.url).searchParams.get('showDeleted') === 'true'
                return HttpResponse.json(showDeleted ? [livePrice, deletedPrice] : [livePrice])
            })
        )
        const user = userEvent.setup()
        renderWithClient(<ProductDetails productBody={productBody} dateToday={new Date()} setDateToday={() => {}} />)

        await screen.findByText('9/4/2026')
        expect(screen.queryByText('9/5/2026')).not.toBeInTheDocument()

        await user.click(screen.getByRole('checkbox', { name: 'Show deleted prices' }))

        await expect.element(await screen.findByText('9/5/2026')).toBeInTheDocument()
    })

    test('should show a message with a retry button when the prices fail to load', async ({ worker }) => {
        worker.use(failFirstPriceRequest())
        renderWithClient(<ProductDetails productBody={productBody} dateToday={new Date()} setDateToday={() => {}} />)

        await expect.element(await screen.findByText("Couldn't load prices")).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    })

    test('should show the prices once a retry succeeds', async ({ worker }) => {
        worker.use(failFirstPriceRequest())
        const user = userEvent.setup()
        renderWithClient(<ProductDetails productBody={productBody} dateToday={new Date()} setDateToday={() => {}} />)

        await user.click(await screen.findByRole('button', { name: 'Retry' }))

        await expect.element(await screen.findByText('9/4/2026')).toBeInTheDocument()
        expect(screen.queryByText("Couldn't load prices")).not.toBeInTheDocument()
    })
})
