import { describe, expect } from 'vitest'
import { renderWithClient, screen, userEvent, test } from '../../test-utils'
import { EditPriceModal } from '../../src/components/home/modals/EditPriceModal'
import { PriceType } from '../../src/utils/Types'

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

describe('Edit Price Component', () => {
    test('should render input for price', async () => {
        renderWithClient(<EditPriceModal price={price} closeEditPrice={() => { }} opened={true} />)

        const discountAmountInput = screen.getByText('Base Price', { selector: 'label' })
        await expect.element(discountAmountInput).toBeInTheDocument()
    })

    test('should render input for discount amount', async () => {
        renderWithClient(<EditPriceModal price={price} closeEditPrice={() => { }} opened={true} />)

        const discountAmountInput = screen.getByText('Discount Amount', { selector: 'label' })
        await expect.element(discountAmountInput).toBeInTheDocument()
    })

    test('should render input for discount percentage', async () => {
        renderWithClient(<EditPriceModal price={price} closeEditPrice={() => { }} opened={true} />)

        const discountPercentLabels = screen.getAllByText('Discount %', { selector: 'label' })
        
        // 2 (counting calculator label)
        expect(discountPercentLabels).toHaveLength(2)
        await expect.element(discountPercentLabels[0]).toBeInTheDocument()
        await expect.element(discountPercentLabels[1]).toBeInTheDocument()
    })

    test('should render input for return percentage', async () => {
        renderWithClient(<EditPriceModal price={price} closeEditPrice={() => { }} opened={true} />)

        const returnPercentageLabels = screen.getAllByText('Return %', { selector: 'label' })

        // 2 (counting calculator label)
        expect(returnPercentageLabels).toHaveLength(2)
        await expect.element(returnPercentageLabels[0]).toBeInTheDocument()
        await expect.element(returnPercentageLabels[1]).toBeInTheDocument()
    })
})