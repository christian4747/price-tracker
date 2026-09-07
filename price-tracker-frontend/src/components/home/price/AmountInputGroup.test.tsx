import { describe, expect } from 'vitest'
import { screen, userEvent, test, render, RenderClientWrapper } from '@/test-utils'
import { AmountInputGroup } from './AmountInputGroup'
import { useReducer } from 'react'
import { createInitialPriceDTO, reducer as priceDTOReducer } from '@/hooks/price/usePriceDTO'
import type { PriceDTO } from '@/utils/Types'

function renderWithPriceDTO(uiFunction: (state: PriceDTO, setField: (key: string, value: string | number) => void) => React.ReactNode) {
    function UIWithPriceDTO() {
        const [state, dispatch] = useReducer(priceDTOReducer, undefined, createInitialPriceDTO)

        const setField = (key: string, value: number | string) => {
            dispatch({ type: 'set_field', key, value })
        }

        return uiFunction(state, setField)
    }

    return render(
        <RenderClientWrapper>
            <UIWithPriceDTO />
        </RenderClientWrapper>
    )
}

describe('Price Input Group Component', () => {

    test('should match discount amount with discount percentage', async () => {
        const user = userEvent.setup()
        
        renderWithPriceDTO((state, setField) => (<AmountInputGroup value={state} setField={setField} />))
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
        
        renderWithPriceDTO((state, setField) => (<AmountInputGroup value={state} setField={setField} />))
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
        
        renderWithPriceDTO((state, setField) => (<AmountInputGroup value={state} setField={setField} />))

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
        
        renderWithPriceDTO((state, setField) => (<AmountInputGroup value={state} setField={setField} />))

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
        
        renderWithPriceDTO((state, setField) => (<AmountInputGroup value={state} setField={setField} />))

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
        
        renderWithPriceDTO((state, setField) => (<AmountInputGroup value={state} setField={setField} />))

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
        
        renderWithPriceDTO((state, setField) => (<AmountInputGroup value={state} setField={setField} />))

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
        
        renderWithPriceDTO((state, setField) => (<AmountInputGroup value={state} setField={setField} />))

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
        
        renderWithPriceDTO((state, setField) => (<AmountInputGroup value={state} setField={setField} />))

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