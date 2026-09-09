import { describe, expect } from 'vitest'
import { renderWithClient, screen, test } from '@/test-utils'
import type { ProductType } from '@/utils/Types'
import { ProductDetails } from './ProductDetails'

const product: ProductType = {
    active: false,
    productId: 0,
    name: 'Product 1',
    link: '',
    store: '',
    createdAt: '',
    updatedAt: '',
    prices: []
}

describe('Product Details Component', () => {
    test('should render product prices', async () => {
        renderWithClient(<ProductDetails product={product} dateToday={new Date()} setDateToday={() => { }} />)

        const price1Date = await screen.findByText('9/4/2026')
        await expect.element(price1Date).toBeInTheDocument()

        const price2Date = await screen.findByText('9/5/2026')
        await expect.element(price2Date).toBeInTheDocument()
    })
})