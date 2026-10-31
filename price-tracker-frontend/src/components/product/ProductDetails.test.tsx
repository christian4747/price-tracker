import { describe, expect } from 'vitest'
import { renderWithClient, screen, test, userEvent } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import type { PriceType } from '@/types/price'
import type { ProductType } from '@/types/product'
import { ProductDetails } from './ProductDetails'

const pricesApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/prices'

const product: ProductType = {
    active: false,
    productId: 0,
    name: 'Product 1',
    link: '',
    store: '',
    createdAt: '',
    deletedAt: null,
    updatedAt: '',
    prices: []
}

const livePrice: PriceType = {
    priceId: 1,
    amount: 100.0,
    currency: 'USD',
    description: '',
    discountAmount: 100.0,
    discountPercentage: 0.0,
    // Built from local times so the expected text doesn't depend on the test machine's time zone
    priceStarted: new Date(2026, 8, 4, 12).toISOString(),
    priceEnded: '',
    returnAmount: 0.0,
    returnPercentage: 0.0,
    today: false,
    totalAmount: 100.0,
    totalPercentage: 0.0,
    createdAt: '2026-09-04T00:00:00.000Z',
    deletedAt: null,
    updatedAt: '2026-09-04T00:00:00.000Z',
    productId: 0
}

const deletedPrice: PriceType = {
    ...livePrice,
    priceId: 2,
    priceStarted: new Date(2026, 8, 5, 12).toISOString(),
    deletedAt: '2026-09-06T00:00:00.000Z'
}

describe('Product Details Component', () => {
    test('should render product prices', async () => {
        renderWithClient(<ProductDetails product={product} dateToday={new Date()} setDateToday={() => {}} />)

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
        renderWithClient(<ProductDetails product={product} dateToday={new Date()} setDateToday={() => {}} />)

        await screen.findByText('9/4/2026')
        expect(screen.queryByText('9/5/2026')).not.toBeInTheDocument()

        await user.click(screen.getByRole('checkbox', { name: 'Show deleted prices' }))

        await expect.element(await screen.findByText('9/5/2026')).toBeInTheDocument()
    })
})
