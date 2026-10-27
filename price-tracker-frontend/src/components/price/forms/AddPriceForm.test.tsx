import { describe, expect } from 'vitest'
import { renderWithClient, screen, test, userEvent, waitFor } from '@/test-utils'
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

    test('should block adding a price that ends before it starts', async ({ worker }) => {
        worker.use(
            http.get(pricesApiUrl + '/recent/:productId', () =>
                HttpResponse.json({
                    baseAmounts: [100],
                    currencies: ['USD'],
                    descriptions: [],
                    discountPercentages: [0],
                    pricesEnded: ['2026-09-05T12:00:00.000Z'],
                    pricesStarted: ['2026-09-10T12:00:00.000Z'],
                    returnPercentages: [0]
                })
            )
        )
        const user = userEvent.setup()
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} quickAdd />)

        const addButton = screen.getByRole('button', { name: 'Add Price' })
        await user.click(screen.getByRole('button', { name: 'Start and End Date' }))

        await waitFor(() => expect(screen.getByText('End date must be after the start date')).toBeInTheDocument())
        expect(addButton).toBeDisabled()

        // The end date is ignored when only adding a start date
        await user.click(screen.getByRole('button', { name: 'Start Date Only' }))
        expect(screen.queryByText('End date must be after the start date')).not.toBeInTheDocument()
        expect(addButton).toBeEnabled()
    })

    test('should default to a valid end date', async () => {
        const user = userEvent.setup()
        renderWithClient(<AddPriceForm product={product} setDateToday={() => {}} close={() => {}} />)

        await user.click(screen.getByRole('button', { name: 'Start and End Date' }))

        expect(screen.queryByText('End date must be after the start date')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Add Price' })).toBeEnabled()
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
