import { describe, expect, onTestFinished, vi } from 'vitest'
import { act, renderHook, RenderClientWrapper, test, waitFor } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import { notifications } from '@mantine/notifications'
import dayjs from 'dayjs'
import type { SetupWorker } from 'msw/browser'
import type { PriceDTO, PriceRangeDTO, PriceType } from '@/types/price'
import type { ProductType } from '@/types/product'
import { useAddPrice } from './useAddPrice'
import { useDeletePrice } from './useDeletePrice'
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

// Built from local times so the expected text doesn't depend on the test machine's time zone
const afternoonPrice: PriceType = { ...price1, priceStarted: new Date(2026, 8, 4, 14, 5).toISOString() }
const lastMinutePrice: PriceType = { ...price1, priceStarted: new Date(2026, 8, 10, 23, 59).toISOString() }

// Watches the notifications until the test ends, and returns the messages shown so far
const watchNotifications = () => {
    const show = vi.spyOn(notifications, 'show')
    onTestFinished(() => show.mockRestore())

    return () => show.mock.calls.map(([notification]) => notification.message)
}

// Saves a price with an end date, recording the request sent for the range and any sent for a single price
const saveRange = async (worker: SetupWorker, useEndDateDesc: boolean) => {
    const rangeBodies: PriceRangeDTO[] = []
    let singlePriceRequests = 0
    worker.use(
        http.post(pricesApiUrl + '/range', async ({ request }) => {
            rangeBodies.push((await request.json()) as PriceRangeDTO)
            return HttpResponse.json([price1, price1])
        }),
        http.post(pricesApiUrl, () => {
            singlePriceRequests++
            return HttpResponse.json(price1)
        })
    )
    const { result } = renderHook(() => useAddPrice(product, useEndDateDesc), { wrapper: RenderClientWrapper })

    act(() => {
        result.current.priceDTO.setField('amount', 100)
        result.current.priceDTO.setField('discountAmount', 80)
        result.current.priceDTO.setField('description', 'Sale')
        result.current.priceDTO.setField('priceStarted', '2026-09-04T00:00:00.000Z')
        result.current.priceDTO.setField('priceEnded', '2026-09-10T00:00:00.000Z')
    })
    act(() => {
        result.current.mutation.mutate()
    })
    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))

    return { rangeBodies, singlePriceRequests }
}

describe('useAddPrice', () => {
    test('should send the price and its dates to the range endpoint', async ({ worker }) => {
        const { rangeBodies } = await saveRange(worker, false)

        expect(rangeBodies).toHaveLength(1)
        expect(rangeBodies[0]).toMatchObject({
            amount: 100,
            discountAmount: 80,
            description: 'Sale',
            priceStarted: dayjs('2026-09-04T00:00:00.000Z').format(),
            priceEnded: dayjs('2026-09-10T00:00:00.000Z').format()
        })
    })

    test.for([true, false])('should send useEndDateDesc as %s', async (useEndDateDesc, { worker }) => {
        const { rangeBodies } = await saveRange(worker, useEndDateDesc)

        expect(rangeBodies[0].useEndDateDesc).toBe(useEndDateDesc)
    })

    test('should not send a separate request for the end price', async ({ worker }) => {
        const { singlePriceRequests } = await saveRange(worker, false)

        expect(singlePriceRequests).toBe(0)
    })

    test('should send a start date only price without an end date to the single price endpoint', async ({ worker }) => {
        const requestBodies: PriceDTO[] = []
        worker.use(
            http.post(pricesApiUrl, async ({ request }) => {
                requestBodies.push((await request.json()) as PriceDTO)
                return HttpResponse.json(price1)
            })
        )
        const { result } = renderHook(() => useAddPrice(product, false), { wrapper: RenderClientWrapper })

        act(() => {
            result.current.singleMutation.mutate()
        })

        await waitFor(() => expect(result.current.singleMutation.isSuccess).toBe(true))
        expect(requestBodies).toHaveLength(1)
        expect(requestBodies[0].priceEnded).toBe('')
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

    test('should notify with a 12-hour time after adding a single price', async ({ worker }) => {
        worker.use(http.post(pricesApiUrl, () => HttpResponse.json(afternoonPrice)))
        const messages = watchNotifications()
        const { result } = renderHook(() => useAddPrice(product, false), { wrapper: RenderClientWrapper })

        act(() => {
            result.current.singleMutation.mutate()
        })

        await waitFor(() => expect(result.current.singleMutation.isSuccess).toBe(true))
        expect(messages()).toEqual(['Successfully added price Sep 4, 2026 2:05 PM'])
    })

    test('should notify with a 12-hour time for both prices after adding a range', async ({ worker }) => {
        worker.use(http.post(pricesApiUrl + '/range', () => HttpResponse.json([afternoonPrice, lastMinutePrice])))
        const messages = watchNotifications()
        const { result } = renderHook(() => useAddPrice(product, false), { wrapper: RenderClientWrapper })

        act(() => {
            result.current.mutation.mutate()
        })

        await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
        expect(messages()).toEqual([
            'Successfully added price Sep 4, 2026 2:05 PM',
            'Successfully added price Sep 10, 2026 11:59 PM'
        ])
    })
})

describe('useDeletePrice', () => {
    test('should notify with a 12-hour time', async ({ worker }) => {
        worker.use(http.delete(pricesApiUrl + '/:priceId', () => HttpResponse.json(afternoonPrice)))
        const messages = watchNotifications()
        const { result } = renderHook(() => useDeletePrice(price1), { wrapper: RenderClientWrapper })

        act(() => {
            result.current.mutation.mutate()
        })

        await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
        expect(messages()).toEqual(['Successfully deleted price Sep 4, 2026 2:05 PM'])
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

    test('should notify with a 12-hour time', async ({ worker }) => {
        worker.use(http.put(pricesApiUrl + '/:priceId', () => HttpResponse.json(afternoonPrice)))
        const messages = watchNotifications()
        const { result } = renderHook(() => useEditPrice(price1), { wrapper: RenderClientWrapper })

        act(() => {
            result.current.mutation.mutate()
        })

        await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
        expect(messages()).toEqual(['Successfully edited price Sep 4, 2026 2:05 PM'])
    })
})
