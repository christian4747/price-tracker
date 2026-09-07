import { describe, expect } from 'vitest'
import { renderWithClient, screen, test, userEvent } from '@/test-utils'
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

    test('should match discount amount with discount percentage', async () => {
            const user = userEvent.setup()
            renderWithClient(<EditPriceForm price={price} closeEditPrice={() => { }} />)
    
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
            renderWithClient(<EditPriceForm price={price} closeEditPrice={() => { }} />)
    
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
            renderWithClient(<EditPriceForm price={price} closeEditPrice={() => { }} />)
    
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
            renderWithClient(<EditPriceForm price={price} closeEditPrice={() => { }} />)
    
            const basePriceInput = screen.getByRole('textbox', { name: /base price/i }) as HTMLInputElement
            await user.clear(basePriceInput)
            await user.type(basePriceInput, '100.00')
    
            const returnAmountInput = screen.getByRole('textbox', { name: /return amount/i }) as HTMLInputElement
            await user.clear(returnAmountInput)
            await user.type(returnAmountInput, '80.00')
    
            const returnPercentageInput = screen.getByRole('textbox', { name: /return %/i }) as HTMLInputElement
            expect(returnPercentageInput.value).toBe('80.00')
        })
    
        test('should use (base - discount) amount for return amount', async () => {
            const user = userEvent.setup()
            renderWithClient(<EditPriceForm price={price} closeEditPrice={() => { }} />)
    
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
    
        test('should use (base - discount) amount for return percentage', async () => {
            const user = userEvent.setup()
            renderWithClient(<EditPriceForm price={price} closeEditPrice={() => { }} />)
    
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
            expect(returnAmountInput.value).toBe('40.00')
        })
    
        test('should update discount amount if base price is updated', async () => {
            const user = userEvent.setup()
            renderWithClient(<EditPriceForm price={price} closeEditPrice={() => { }} />)
    
            const basePriceInput = screen.getByRole('textbox', { name: /base price/i }) as HTMLInputElement
            await user.clear(basePriceInput)
            await user.type(basePriceInput, '100.00')
    
            const discountAmountInput = screen.getByRole('textbox', { name: /discount amount/i }) as HTMLInputElement
            await user.clear(discountAmountInput)
            await user.type(discountAmountInput, '80.00') // 20%
    
            await user.clear(basePriceInput)
            await user.type(basePriceInput, '80.00')
    
            expect(discountAmountInput.value).toBe('64.00')
        })
    
        test('should update return amount if base price is updated', async () => {
            const user = userEvent.setup()
            renderWithClient(<EditPriceForm price={price} closeEditPrice={() => { }} />)
    
            const basePriceInput = screen.getByRole('textbox', { name: /base price/i }) as HTMLInputElement
            await user.clear(basePriceInput)
            await user.type(basePriceInput, '100.00')
    
            const discountAmountInput = screen.getByRole('textbox', { name: /discount amount/i }) as HTMLInputElement
            await user.clear(discountAmountInput)
            await user.type(discountAmountInput, '80.00') // 20%
    
            const returnPercentageInput = screen.getByRole('textbox', { name: /return %/i }) as HTMLInputElement
            await user.clear(returnPercentageInput)
            await user.type(returnPercentageInput, '50.00')
    
            await user.clear(basePriceInput)
            await user.type(basePriceInput, '80.00')
    
            const returnAmountInput = screen.getByRole('textbox', { name: /return amount/i }) as HTMLInputElement
    
            expect(discountAmountInput.value).toBe('64.00')
            expect(returnAmountInput.value).toBe('32.00')
        })
    
        test('should set discount & return amount to 0 when base amount is set to 0', async () => {
            const user = userEvent.setup()
            renderWithClient(<EditPriceForm price={price} closeEditPrice={() => { }} />)
    
            const basePriceInput = screen.getByRole('textbox', { name: /base price/i }) as HTMLInputElement
            await user.clear(basePriceInput)
            await user.type(basePriceInput, '100.00')
    
            const discountAmountInput = screen.getByRole('textbox', { name: /discount amount/i }) as HTMLInputElement
            await user.clear(discountAmountInput)
            await user.type(discountAmountInput, '80.00')
    
            const returnPercentageInput = screen.getByRole('textbox', { name: /return %/i }) as HTMLInputElement
            await user.clear(returnPercentageInput)
            await user.type(returnPercentageInput, '50.00')
    
            await user.clear(basePriceInput)
            await user.type(basePriceInput, '0.00')
    
            const returnAmountInput = screen.getByRole('textbox', { name: /return amount/i }) as HTMLInputElement
    
            expect(discountAmountInput.value).toBe('0.00')
            expect(returnAmountInput.value).toBe('0.00')
        })
})