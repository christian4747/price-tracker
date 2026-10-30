import { describe, expect, vi } from 'vitest'
import { renderWithClient, screen, test, userEvent, waitFor } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import { EditPriceForm } from './EditPriceForm'
import type { PriceType } from '@/types/price'

const price: PriceType = {
    priceId: 1,
    amount: 100.0,
    currency: '',
    description: '',
    discountAmount: 0.0,
    discountPercentage: 0.0,
    priceStarted: '2026-09-04T00:00:00.000Z',
    priceEnded: '',
    returnAmount: 0.0,
    returnPercentage: 0.0,
    totalAmount: 0.0,
    totalPercentage: 0.0,
    createdAt: '2026-09-04T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z',
    productId: 0,
    today: false,
    deletedAt: null
}

const pricesApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/prices'

describe('Edit Price Form Component', () => {
    test("should fill amounts from the product's recent prices", async ({ worker }) => {
        let requestedProductId: string | undefined
        worker.use(
            http.get(pricesApiUrl + '/recent/:productId', ({ params }) => {
                requestedProductId = params.productId as string
                return HttpResponse.json({
                    baseAmounts: [250],
                    currencies: [],
                    descriptions: [],
                    discountPercentages: [0.2],
                    pricesEnded: [],
                    pricesStarted: [],
                    returnPercentages: [0.05]
                })
            })
        )
        const user = userEvent.setup()
        renderWithClient(<EditPriceForm price={{ ...price, productId: 7 }} closeEditPrice={() => {}} />)

        await user.click(await screen.findByRole('button', { name: '250' }))
        await user.click(screen.getByRole('button', { name: '20.00%' }))
        await user.click(screen.getByRole('button', { name: '5.00%' }))

        expect(requestedProductId).toBe('7')
        expect((screen.getByRole('textbox', { name: /base price/i }) as HTMLInputElement).value).toBe('250.00')
        expect((screen.getByRole('textbox', { name: /discount amount/i }) as HTMLInputElement).value).toBe('200.00')
        expect((screen.getByRole('textbox', { name: /return amount/i }) as HTMLInputElement).value).toBe('10.00')
    })

    test('should show the save in progress and close once it succeeds', async ({ worker }) => {
        let finishSave = () => {}
        const saveFinished = new Promise<void>((resolve) => (finishSave = resolve))
        worker.use(
            http.put(pricesApiUrl + '/:priceId', async () => {
                await saveFinished
                return HttpResponse.json(price)
            })
        )
        const closeEditPrice = vi.fn()
        const user = userEvent.setup()
        renderWithClient(<EditPriceForm price={price} closeEditPrice={closeEditPrice} />)

        const submitButton = screen.getByRole('button', { name: 'Edit Price' })
        await user.click(submitButton)

        await waitFor(() => expect(submitButton).toBeDisabled())
        expect(closeEditPrice).not.toHaveBeenCalled()

        finishSave()

        await waitFor(() => expect(closeEditPrice).toHaveBeenCalledOnce())
    })

    test('should stay open with its values when the save is rejected', async ({ worker }) => {
        let saveRejected = false
        worker.use(
            http.put(pricesApiUrl + '/:priceId', () => {
                saveRejected = true
                return HttpResponse.text('Price is invalid', { status: 400 })
            })
        )
        const closeEditPrice = vi.fn()
        const user = userEvent.setup()
        renderWithClient(<EditPriceForm price={price} closeEditPrice={closeEditPrice} />)

        await user.type(screen.getByRole('textbox', { name: 'Description' }), 'Sale')
        const submitButton = screen.getByRole('button', { name: 'Edit Price' })
        await user.click(submitButton)

        await waitFor(() => expect(saveRejected).toBe(true))
        await waitFor(() => expect(submitButton).toBeEnabled())
        expect(closeEditPrice).not.toHaveBeenCalled()
        expect((screen.getByRole('textbox', { name: 'Description' }) as HTMLInputElement).value).toBe('Sale')
    })

    test('should render input for price', async () => {
        renderWithClient(<EditPriceForm price={price} closeEditPrice={() => {}} />)

        const discountAmountInput = screen.getByText('Base Price', { selector: 'label' })
        await expect.element(discountAmountInput).toBeInTheDocument()
    })

    test('should render input for discount amount', async () => {
        renderWithClient(<EditPriceForm price={price} closeEditPrice={() => {}} />)

        const discountAmountInput = screen.getByText('Discount Amount', { selector: 'label' })
        await expect.element(discountAmountInput).toBeInTheDocument()
    })

    test('should render input for discount percentage', async () => {
        renderWithClient(<EditPriceForm price={price} closeEditPrice={() => {}} />)

        const discountPercentLabel = screen.getByText('Discount %', { selector: 'label' })
        await expect.element(discountPercentLabel).toBeInTheDocument()
    })

    test('should render input for return percentage', async () => {
        renderWithClient(<EditPriceForm price={price} closeEditPrice={() => {}} />)

        const returnPercentageLabel = screen.getByText('Return %', { selector: 'label' })
        await expect.element(returnPercentageLabel).toBeInTheDocument()
    })
})
