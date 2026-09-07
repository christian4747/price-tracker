import { describe, expect } from 'vitest'
import { renderWithClient, screen, test } from '@/test-utils'
import { EditPriceForm } from './EditPriceForm'
import type { PriceType } from '@/utils/Types'

const price: PriceType = {
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
    createdAt: "2026-09-04T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
    productId: 0
}

describe('Edit Price Form Component', () => {
    test('should render input for price', async () => {
        renderWithClient(<EditPriceForm price={price} closeEditPrice={() => { }} />)

        const discountAmountInput = screen.getByText('Base Price', { selector: 'label' })
        await expect.element(discountAmountInput).toBeInTheDocument()
    })

    test('should render input for discount amount', async () => {
        renderWithClient(<EditPriceForm price={price} closeEditPrice={() => { }} />)

        const discountAmountInput = screen.getByText('Discount Amount', { selector: 'label' })
        await expect.element(discountAmountInput).toBeInTheDocument()
    })

    test('should render input for discount percentage', async () => {
        renderWithClient(<EditPriceForm price={price} closeEditPrice={() => { }} />)

        const discountPercentLabel = screen.getByText('Discount %', { selector: 'label' })
        await expect.element(discountPercentLabel).toBeInTheDocument()
    })

    test('should render input for return percentage', async () => {
        renderWithClient(<EditPriceForm price={price} closeEditPrice={() => { }} />)

        const returnPercentageLabel = screen.getByText('Return %', { selector: 'label' })
        await expect.element(returnPercentageLabel).toBeInTheDocument()
    })
})