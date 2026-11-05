import { describe, expect } from 'vitest'
import { screen, userEvent, test, render, RenderClientWrapper } from '@/test-utils'
import { AmountInputGroup } from './AmountInputGroup'
import { useReducer } from 'react'
import { createInitialPriceDTO, reducer as priceDTOReducer } from '@/hooks/price/usePriceDTO'
import type { PriceDTO } from '@/types/price'
// The widths come from Tailwind classes, so the layout tests need the app's styles
import '@/styles/index.css'

function renderWithPriceDTO(
    uiFunction: (state: PriceDTO, setField: (key: string, value: string | number) => void) => React.ReactNode
) {
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

describe('Amount Input Group Component', () => {
    test('should match discount amount with discount percentage', async () => {
        const user = userEvent.setup()

        renderWithPriceDTO((state, setField) => <AmountInputGroup value={state} setField={setField} />)
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

        renderWithPriceDTO((state, setField) => <AmountInputGroup value={state} setField={setField} />)
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

        renderWithPriceDTO((state, setField) => <AmountInputGroup value={state} setField={setField} />)

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

        renderWithPriceDTO((state, setField) => <AmountInputGroup value={state} setField={setField} />)

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

        renderWithPriceDTO((state, setField) => <AmountInputGroup value={state} setField={setField} />)

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

        renderWithPriceDTO((state, setField) => <AmountInputGroup value={state} setField={setField} />)

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

        renderWithPriceDTO((state, setField) => <AmountInputGroup value={state} setField={setField} />)

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

        renderWithPriceDTO((state, setField) => <AmountInputGroup value={state} setField={setField} />)

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

        renderWithPriceDTO((state, setField) => <AmountInputGroup value={state} setField={setField} />)

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

    describe('layout', () => {
        // The width of a large modal's content, as measured in the app: 620px less its padding and the room kept for a
        // scrollbar on each side
        const MODAL_CONTENT_WIDTH = 558

        // Renders the group in a box as wide as a large modal's content, and returns the box
        const renderInModalWidth = () => {
            renderWithPriceDTO((state, setField) => (
                <div data-testid="modal-content" style={{ width: MODAL_CONTENT_WIDTH }}>
                    <AmountInputGroup value={state} setField={setField} />
                </div>
            ))
            return screen.getByTestId('modal-content').getBoundingClientRect()
        }

        // Where an input's whole field sits, label included, found by the input's label
        const fieldBox = (name: RegExp) =>
            screen.getByRole('textbox', { name }).closest('.mantine-NumberInput-root')!.getBoundingClientRect()

        test('should stretch the base price across the modal', () => {
            const content = renderInModalWidth()

            expect(fieldBox(/base price/i).width).toBe(content.width)
        })

        test.each([
            ['discount', /discount amount/i, /discount %/i],
            ['return', /return amount/i, /return %/i]
        ])('should fill the modal with the %s row', (_row, amountName, percentageName) => {
            const content = renderInModalWidth()

            expect(fieldBox(amountName).left).toBe(content.left)
            expect(fieldBox(percentageName).right).toBe(content.right)
        })

        test.each([
            ['discount', /discount amount/i, /discount %/i],
            ['return', /return amount/i, /return %/i]
        ])('should give the extra room in the %s row to the amount', (_row, amountName, percentageName) => {
            renderInModalWidth()

            // The percentage stays narrow, since it never needs more than "100.00"
            expect(fieldBox(percentageName).width).toBe(100)
            expect(fieldBox(amountName).width).toBeGreaterThan(fieldBox(percentageName).width)
        })
    })
})
