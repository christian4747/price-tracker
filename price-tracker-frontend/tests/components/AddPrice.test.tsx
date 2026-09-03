import { describe, expect } from 'vitest'
import { renderWithClient, screen, userEvent, test } from '../../test-utils'
import { AddPriceModal } from '../../src/components/home/modals/AddPriceModal'
import { ProductType } from '../../src/utils/Types'

const product: ProductType = {
    active: false,
    productId: 0,
    name: '',
    link: '',
    store: '',
    createdAt: '',
    updatedAt: '',
    prices: []
}

describe('Add Price Component', () => {
    test('should render input for price', async () => {
        renderWithClient(<AddPriceModal product={product} setDateToday={() => { }} />)

        const openAddPrice = screen.getByRole('button')
        await userEvent.click(openAddPrice)

        const discountAmountInput = screen.getByText('Base Price', { selector: 'label' })
        await expect.element(discountAmountInput).toBeInTheDocument()
    })

    test('should render input for discount amount', async () => {
        renderWithClient(<AddPriceModal product={product} setDateToday={() => { }} />)

        const openAddPrice = screen.getByRole('button')
        await userEvent.click(openAddPrice)

        const discountAmountInput = screen.getByText('Discount Amount', { selector: 'label' })
        await expect.element(discountAmountInput).toBeInTheDocument()
    })

    test('should render input for discount percentage', async () => {
        renderWithClient(<AddPriceModal product={product} setDateToday={() => { }} />)

        const openAddPrice = screen.getByRole('button')
        await userEvent.click(openAddPrice)

        const discountPercentLabels = screen.getAllByText('Discount %', { selector: 'label' })
        
        // 2 (counting calculator label)
        expect(discountPercentLabels).toHaveLength(2)
        await expect.element(discountPercentLabels[0]).toBeInTheDocument()
        await expect.element(discountPercentLabels[1]).toBeInTheDocument()
    })

    test('should render input for return percentage', async () => {
        renderWithClient(<AddPriceModal product={product} setDateToday={() => { }} />)

        const openAddPrice = screen.getByRole('button')
        await userEvent.click(openAddPrice)

        const returnPercentageLabels = screen.getAllByText('Return %', { selector: 'label' })

        expect(returnPercentageLabels).toHaveLength(2)
        await expect.element(returnPercentageLabels[0]).toBeInTheDocument()
        await expect.element(returnPercentageLabels[1]).toBeInTheDocument()
    })
})