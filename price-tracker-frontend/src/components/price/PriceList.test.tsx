import { describe, expect } from 'vitest'
import { createPrice, renderWithClient, screen, test, userEvent } from '@/test-utils'
import type { ProductType } from '@/types/product'
import { PriceList } from './PriceList'
import { useState } from 'react'

const price1 = createPrice(1, { priceStarted: '2026-09-04T00:00:00.000Z' })
const price2 = createPrice(2, { priceStarted: '2026-09-05T00:00:00.000Z' })

const product: ProductType = {
    active: false,
    productId: 0,
    name: 'Product 1',
    link: '',
    store: '',
    createdAt: '',
    deletedAt: null,
    updatedAt: '',
    prices: [price1, price2]
}

const renderPriceList = () => {
    function PriceListWithState() {
        const [checked, setChecked] = useState(false)

        return (
            <PriceList
                product={product}
                prices={product.prices}
                setDateToday={() => {}}
                showDeleted={checked}
                setShowDeleted={setChecked}
            />
        )
    }

    return renderWithClient(<PriceListWithState />)
}

describe('Price List Component', () => {
    test('should render product prices', async () => {
        renderPriceList()

        const price1Date = screen.getByText('9/4/2026')
        await expect.element(price1Date).toBeInTheDocument()

        const price2Date = screen.getByText('9/5/2026')
        await expect.element(price2Date).toBeInTheDocument()
    })

    test('should render add price button', async () => {
        renderPriceList()

        const price1Date = screen.getByText(/add price/i)
        await expect.element(price1Date).toBeInTheDocument()
    })

    test('should render show deleted prices checkbox', async () => {
        renderPriceList()

        const checkbox = screen.getByRole('checkbox', { name: /show deleted/i })
        await expect.element(checkbox).toBeInTheDocument()

        const price1Date = screen.getByText('9/4/2026')
        await expect.element(price1Date).toBeInTheDocument()

        const price2Date = screen.getByText('9/5/2026')
        await expect.element(price2Date).toBeInTheDocument()
    })

    test('should render checked checkbox', async () => {
        const user = userEvent.setup()

        renderPriceList()

        const checkbox = screen.getByRole('checkbox', { name: /show deleted/i })
        await expect.element(checkbox).toBeInTheDocument()
        await expect.element(checkbox).not.toBeChecked()
        await user.click(checkbox)
        await expect.element(checkbox).toBeChecked()
    })
})
