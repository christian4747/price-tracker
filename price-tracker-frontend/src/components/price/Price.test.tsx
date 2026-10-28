import { describe, expect } from 'vitest'
import { renderWithClient, screen, test, userEvent, waitFor } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import type { PriceType } from '@/types/price'
import { Price } from './Price'

const pricesApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/prices'

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
    today: false,
    totalAmount: 0.0,
    totalPercentage: 0.0,
    createdAt: '2026-09-04T00:00:00.000Z',
    deletedAt: null,
    updatedAt: '2026-09-04T00:00:00.000Z',
    productId: 0
}

const deletedPrice: PriceType = {
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
    today: false,
    totalAmount: 0.0,
    totalPercentage: 0.0,
    createdAt: '2026-09-04T00:00:00.000Z',
    deletedAt: 'deleted',
    updatedAt: '2026-09-04T00:00:00.000Z',
    productId: 0
}

describe('Price Component', () => {
    test('should render price', async () => {
        renderWithClient(<Price price={price} openEditPriceModal={() => {}} openDeletePriceModal={() => {}} />)

        const price1Date = await screen.findByText('9/4/2026')
        await expect.element(price1Date).toBeInTheDocument()
    })

    test('should render delete price button', async () => {
        renderWithClient(<Price price={price} openEditPriceModal={() => {}} openDeletePriceModal={() => {}} />)

        const deletePriceButton = screen.getByRole('img', { name: /delete price/i })
        await expect.element(deletePriceButton).toBeInTheDocument()
    })

    test('should not render delete price button', async () => {
        renderWithClient(<Price price={deletedPrice} openEditPriceModal={() => {}} openDeletePriceModal={() => {}} />)

        const deletePriceButton = screen.queryByRole('img', { name: /delete price/i })
        await expect.element(deletePriceButton).not.toBeInTheDocument()
    })

    test('should not render restore price button', async () => {
        renderWithClient(<Price price={price} openEditPriceModal={() => {}} openDeletePriceModal={() => {}} />)

        const restorePriceButton = screen.queryByRole('img', { name: /restore price/i })
        await expect.element(restorePriceButton).not.toBeInTheDocument()
    })

    test('should restore a deleted price', async ({ worker }) => {
        const restoredPriceIds: string[] = []
        worker.use(
            http.put(pricesApiUrl + '/:priceId/restore', ({ params }) => {
                restoredPriceIds.push(params.priceId as string)
                return HttpResponse.json({ ...deletedPrice, deletedAt: null })
            })
        )
        const user = userEvent.setup()
        renderWithClient(<Price price={deletedPrice} openEditPriceModal={() => {}} openDeletePriceModal={() => {}} />)

        await user.click(screen.getByRole('img', { name: /restore price/i }))

        await waitFor(() => expect(restoredPriceIds).toEqual(['1']))
    })
})
