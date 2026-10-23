import { describe, expect } from 'vitest'
import { act, renderHook, RenderClientWrapper, test, waitFor } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import dayjs from 'dayjs'
import type { PriceDTO, PriceType } from '@/types/price'
import type { ProductType } from '@/types/product'
import { useAddPrice } from './useAddPrice'
import { useEditPrice } from './useEditPrice'

const pricesApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/prices'

const product: ProductType = {
    active: true,
    productId: 0,
    name: 'Product 1',
    link: '',
    store: '',
    createdAt: '',
    deletedAt: null,
    updatedAt: '',
    prices: []
}

const price1: PriceType = {
    priceId: 1,
    amount: 100.0,
    currency: 'USD',
    description: 'Sale',
    discountAmount: 80.0,
    discountPercentage: 20.0,
    priceStarted: '2026-09-04T00:00:00.000Z',
    priceEnded: '',
    returnAmount: 0.0,
    returnPercentage: 0.0,
    today: true,
    totalAmount: 80.0,
    totalPercentage: 20.0,
    createdAt: '2026-09-04T00:00:00.000Z',
    deletedAt: null,
    updatedAt: '2026-09-04T00:00:00.000Z',
    productId: 0
}

describe('useAddPrice', () => {
    test('should add a second price at full amount when an end date is given', async ({ worker }) => {
        const requestBodies: PriceDTO[] = []
        worker.use(
            http.post(pricesApiUrl, async ({ request }) => {
                const body = (await request.json()) as PriceDTO
                requestBodies.push(body)
                return HttpResponse.json(price1)
            })
        )
        const { result } = renderHook(() => useAddPrice(product, false), { wrapper: RenderClientWrapper })

        act(() => {
            result.current.priceDTO.setField('amount', 100)
            result.current.priceDTO.setField('discountAmount', 80)
            result.current.priceDTO.setField('discountPercentage', 20)
            result.current.priceDTO.setField('description', 'Sale')
            result.current.priceDTO.setField('priceStarted', '2026-09-04T00:00:00.000Z')
            result.current.priceDTO.setField('priceEnded', '2026-09-10T00:00:00.000Z')
        })
        act(() => {
            result.current.mutation.mutate()
        })

        await waitFor(() => expect(requestBodies).toHaveLength(2))
        expect(requestBodies[0]).toMatchObject({
            amount: 100,
            discountAmount: 80,
            description: 'Sale',
            priceStarted: dayjs('2026-09-04T00:00:00.000Z').format(),
            priceEnded: dayjs('2026-09-10T00:00:00.000Z').format()
        })
        expect(requestBodies[1]).toMatchObject({
            amount: 100,
            discountAmount: 100,
            discountPercentage: 0,
            returnAmount: 0,
            returnPercentage: 0,
            description: '',
            priceStarted: dayjs('2026-09-10T00:00:00.000Z').format(),
            priceEnded: ''
        })
    })

    test('should keep the default end date after adding an unedited price', async ({ worker }) => {
        worker.use(http.post(pricesApiUrl, () => HttpResponse.json(price1)))
        const { result } = renderHook(() => useAddPrice(product, false), { wrapper: RenderClientWrapper })
        const defaultPriceEnded = result.current.priceDTO.value.priceEnded

        act(() => {
            result.current.singleMutation.mutate()
        })

        await waitFor(() => expect(result.current.singleMutation.isSuccess).toBe(true))
        expect(result.current.priceDTO.value.priceEnded).toBe(defaultPriceEnded)
    })
})

describe('useEditPrice', () => {
    test('should not modify the price being edited', async ({ worker }) => {
        worker.use(http.put(pricesApiUrl + '/:priceId', () => HttpResponse.json(price1)))
        const price = { ...price1 }
        const { result } = renderHook(() => useEditPrice(price), { wrapper: RenderClientWrapper })

        act(() => {
            result.current.mutation.mutate()
        })

        await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
        expect(price).toEqual(price1)
    })
})
