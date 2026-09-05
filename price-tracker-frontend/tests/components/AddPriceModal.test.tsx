import { describe, expect } from 'vitest'
import { renderWithClient, screen, userEvent, test } from '../../test-utils'
import { ProductType } from '../../src/utils/Types'
import { AddPriceForm } from '../../src/components/home/forms/AddPriceForm'

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

describe('Add Price Form Component', () => {
    test('should render input for price', async () => {
        renderWithClient(<AddPriceForm product={product} setDateToday={() => { }} />)

        const discountAmountInput = screen.getByText('Base Price', { selector: 'label' })
        await expect.element(discountAmountInput).toBeInTheDocument()
    })

    test('should render input for discount amount', async () => {
        renderWithClient(<AddPriceForm product={product} setDateToday={() => { }} />)

        const discountAmountInput = screen.getByText('Discount Amount', { selector: 'label' })
        await expect.element(discountAmountInput).toBeInTheDocument()
    })

    test('should render input for discount percentage', async () => {
        renderWithClient(<AddPriceForm product={product} setDateToday={() => { }} />)

        const discountPercentLabel = screen.getByText('Discount %', { selector: 'label' })
        await expect.element(discountPercentLabel).toBeInTheDocument()
    })

    test('should render input for return percentage', async () => {
        renderWithClient(<AddPriceForm product={product} setDateToday={() => { }} />)

        const returnPercentageLabel = screen.getByText('Return %', { selector: 'label' })
        await expect.element(returnPercentageLabel).toBeInTheDocument()
    })

    test('should match discount amount with discount percentage', async () => {
        const user = userEvent.setup()
        renderWithClient(<AddPriceForm product={product} setDateToday={() => { }} />)

        const basePriceInput = screen.getByRole('textbox', { name: /base price/i }) as HTMLInputElement
        await user.clear(basePriceInput)
        await user.type(basePriceInput, '100.00')
        expect(basePriceInput.value).toBe('100.00')

        const discountPercentageInput = screen.getByRole('textbox', { name: /discount %/i }) as HTMLInputElement
        await user.clear(discountPercentageInput)
        await user.type(discountPercentageInput, '80.00')

        const discountAmountInput = screen.getByRole('textbox', { name: /discount amount/i }) as HTMLInputElement
        expect(discountAmountInput.value).toBe('20.00')
    })

    test('should match discount percentage with discount amount', async () => {
        const user = userEvent.setup()
        renderWithClient(<AddPriceForm product={product} setDateToday={() => { }} />)

        const basePriceInput = screen.getByRole('textbox', { name: /base price/i }) as HTMLInputElement
        await user.clear(basePriceInput)
        await user.type(basePriceInput, '100.00')

        const discountAmountInput = screen.getByRole('textbox', { name: /discount amount/i }) as HTMLInputElement
        await user.clear(discountAmountInput)
        await user.type(discountAmountInput, '20.00')

        const discountPercentageInputs = screen.getByRole('textbox', { name: /discount %/i }) as HTMLInputElement
        expect(discountPercentageInputs.value).toBe('80.00')
    })

    test('should match return amount with return percentage', async () => {
        const user = userEvent.setup()
        renderWithClient(<AddPriceForm product={product} setDateToday={() => { }} />)

        const basePriceInput = screen.getByRole('textbox', { name: /base price/i }) as HTMLInputElement
        await user.clear(basePriceInput)
        await user.type(basePriceInput, '100.00')

        const returnPercentageInput = screen.getByRole('textbox', { name: /return %/i }) as HTMLInputElement
        await user.clear(returnPercentageInput)
        await user.type(returnPercentageInput, '80.00')
        
        const returnAmountInput = screen.getByRole('textbox', { name: /return amount/i }) as HTMLInputElement
        expect(returnAmountInput.value).toBe('80.00')
    })

    test('should match return percentage with return amount', async () => {
        const user = userEvent.setup()
        renderWithClient(<AddPriceForm product={product} setDateToday={() => { }} />)

        const basePriceInput = screen.getByRole('textbox', { name: /base price/i }) as HTMLInputElement
        await user.clear(basePriceInput)
        await user.type(basePriceInput, '100.00')

        const returnAmountInput = screen.getByRole('textbox', { name: /return amount/i }) as HTMLInputElement
        await user.clear(returnAmountInput)
        await user.type(returnAmountInput, '80.00')

        const returnPercentageInput = screen.getByRole('textbox', { name: /return %/i }) as HTMLInputElement
        expect(returnPercentageInput.value).toBe('80.00')
    })

    test('should use base - discount amount for return amount', async () => {
        const user = userEvent.setup()
        renderWithClient(<AddPriceForm product={product} setDateToday={() => { }} />)

        const basePriceInput = screen.getByRole('textbox', { name: /base price/i }) as HTMLInputElement
        await user.clear(basePriceInput)
        await user.type(basePriceInput, '100.00')

        const discountAmountInput = screen.getByRole('textbox', { name: /discount amount/i }) as HTMLInputElement
        await user.clear(discountAmountInput)
        await user.type(discountAmountInput, '80.00')

        const returnAmountInput = screen.getByRole('textbox', { name: /return amount/i }) as HTMLInputElement
        await user.clear(returnAmountInput)
        await user.type(returnAmountInput, '40.00')

        const returnPercentageInput = screen.getByRole('textbox', { name: /return %/i }) as HTMLInputElement
        expect(returnPercentageInput.value).toBe('50.00')
    })

    test('should use base - discount amount for return percentage', async () => {
        const user = userEvent.setup()
        renderWithClient(<AddPriceForm product={product} setDateToday={() => { }} />)

        const basePriceInput = screen.getByRole('textbox', { name: /base price/i }) as HTMLInputElement
        await user.clear(basePriceInput)
        await user.type(basePriceInput, '100.00')

        const discountAmountInput = screen.getByRole('textbox', { name: /discount amount/i }) as HTMLInputElement
        await user.clear(discountAmountInput)
        await user.type(discountAmountInput, '80.00')

        const returnPercentageInput = screen.getByRole('textbox', { name: /return %/i }) as HTMLInputElement
        await user.clear(returnPercentageInput)
        await user.type(returnPercentageInput, '50.00')

        const returnAmountInput = screen.getByRole('textbox', { name: /return amount/i }) as HTMLInputElement
        // 0 = calculator, 1 = form
        expect(returnAmountInput.value).toBe('40.00')
    })
})