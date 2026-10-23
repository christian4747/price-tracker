import { describe, expect } from 'vitest'
import { renderWithClient, screen, test, waitFor } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import { AddPriceForm } from './AddPriceForm'
import type { ProductType } from '@/types/product'

const product: ProductType = {
    active: false,
    productId: 0,
    name: '',
    link: '',
    store: '',
    createdAt: '',
    updatedAt: '',
    prices: [],
    deletedAt: null
}

const pricesApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/prices'

describe('Add Price Form Component', () => {
    test('should prefill quick add with the most recent price and its derived amounts', async ({ worker }) => {
        worker.use(
            http.get(pricesApiUrl + '/recent/:productId', () =>
                HttpResponse.json({
                    baseAmounts: [100],
                    currencies: ['USD'],
                    descriptions: [],
                    discountPercentages: [0.2],
                    pricesEnded: [],
                    pricesStarted: [],
                    returnPercentages: [0.05]
                })
            )
        )
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} quickAdd />)

        const discountAmountInput = screen.getByRole('textbox', { name: /discount amount/i }) as HTMLInputElement
        const returnAmountInput = screen.getByRole('textbox', { name: /return amount/i }) as HTMLInputElement
        await waitFor(() => {
            expect(discountAmountInput.value).toBe('80.00')
            expect(returnAmountInput.value).toBe('4.00')
        })
    })

    test('should render input for price', async () => {
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} />)

        const discountAmountInput = screen.getByText('Base Price', { selector: 'label' })
        await expect.element(discountAmountInput).toBeInTheDocument()
    })

    test('should render input for discount amount', async () => {
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} />)

        const discountAmountInput = screen.getByText('Discount Amount', { selector: 'label' })
        await expect.element(discountAmountInput).toBeInTheDocument()
    })

    test('should render input for discount percentage', async () => {
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} />)

        const discountPercentLabel = screen.getByText('Discount %', { selector: 'label' })
        await expect.element(discountPercentLabel).toBeInTheDocument()
    })

    test('should render input for return percentage', async () => {
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} />)

        const returnPercentageLabel = screen.getByText('Return %', { selector: 'label' })
        await expect.element(returnPercentageLabel).toBeInTheDocument()
    })
})
