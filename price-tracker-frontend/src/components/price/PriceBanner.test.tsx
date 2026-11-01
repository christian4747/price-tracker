import { afterEach, describe, expect, vi } from 'vitest'
import { createPrice, renderWithClient, screen, test } from '@/test-utils'
import type { ProductBody, ProductType } from '@/types/product'
import { PriceBanner } from './PriceBanner'

const product: ProductType = {
    active: true,
    productId: 0,
    name: 'Product 1',
    link: '',
    store: '',
    createdAt: '',
    deletedAt: null,
    updatedAt: '',
    prices: []
}

const price1 = createPrice(1, { currency: 'USD', today: true, totalAmount: 100.0 })

const productBodyNoPrice: ProductBody = {
    product: product,
    priceToday: undefined,
    nextPrice: undefined,
    priceCategory: '',
    lastUpdated: '2026-09-04T00:00:00.000Z'
}

const productBodyWithPrice: ProductBody = { ...productBodyNoPrice, priceToday: price1 }

describe('PriceBanner Component', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    test('should render the price', async () => {
        renderWithClient(
            <PriceBanner productBody={productBodyWithPrice} dateToday={new Date()} setDateToday={() => {}} />
        )

        const priceText = screen.getByText('$100.00')
        await expect.element(priceText).toBeInTheDocument()
    })

    test('should render nothing once the price for today is removed', async () => {
        const { rerender } = renderWithClient(
            <PriceBanner productBody={productBodyWithPrice} dateToday={new Date()} setDateToday={() => {}} />
        )

        rerender(<PriceBanner productBody={productBodyNoPrice} dateToday={new Date()} setDateToday={() => {}} />)

        expect(screen.queryByText('$100.00')).toBeNull()
    })

    test('should stop the price timer once the price for today is removed', async () => {
        const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')
        const nextPrice = createPrice(2, { priceStarted: new Date(Date.now() + 60_000).toISOString() })
        const { rerender } = renderWithClient(
            <PriceBanner
                productBody={{ ...productBodyWithPrice, nextPrice: nextPrice }}
                dateToday={new Date()}
                setDateToday={() => {}}
            />
        )

        rerender(<PriceBanner productBody={productBodyNoPrice} dateToday={new Date()} setDateToday={() => {}} />)

        expect(clearTimeoutSpy).toHaveBeenCalled()
    })
})
