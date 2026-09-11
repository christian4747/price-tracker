import { describe, expect } from 'vitest'
import { renderWithClient, screen, test } from '@/test-utils'
import type { PriceType, ProductType } from '@/utils/Types'
import { PriceList } from './PriceList'

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
    totalAmount: 0.0,
    totalPercentage: 0.0,
    createdAt: "2026-09-05T00:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
    productId: 0
}

const product: ProductType = {
    active: false,
    productId: 0,
    name: 'Product 1',
    link: '',
    store: '',
    createdAt: '',
    updatedAt: '',
    prices: [price1, price2]
}

describe('Price List Component', () => {
    test('should render product prices', async () => {
        renderWithClient(<PriceList product={product} prices={[price1, price2]} setDateToday={() => { }} />)

        const price1Date = screen.getByText('9/4/2026')
        await expect.element(price1Date).toBeInTheDocument()

        const price2Date = screen.getByText('9/5/2026')
        await expect.element(price2Date).toBeInTheDocument()
    })

    test('should render add price button', async () => {
        renderWithClient(<PriceList product={product} prices={[price1, price2]} setDateToday={() => { }} />)

        const price1Date = screen.getByText(/add price/i)
        await expect.element(price1Date).toBeInTheDocument()
    })
})