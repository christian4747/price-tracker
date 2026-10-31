import { describe, expect, test } from 'vitest'
import { renderHook } from '@/test-utils'
import type { PriceType } from '@/types/price'
import { usePriceData } from './usePriceData'

const createPrice = (priceId: number, changes: Partial<PriceType> = {}): PriceType => ({
    priceId,
    amount: 100.0,
    currency: 'USD',
    description: '',
    discountAmount: 100.0,
    discountPercentage: 0.0,
    priceStarted: '2026-09-04T00:00:00.000Z',
    priceEnded: '',
    returnAmount: 0.0,
    returnPercentage: 0.0,
    today: false,
    totalAmount: 100.0,
    totalPercentage: 0.0,
    createdAt: '2026-09-04T00:00:00.000Z',
    deletedAt: null,
    updatedAt: '2026-09-04T00:00:00.000Z',
    productId: 1,
    ...changes
})

const deletedAt = '2026-10-01T00:00:00.000Z'

// Returns the IDs of the prices the chart would draw
const getChartPriceIds = (prices: PriceType[]) => {
    const { result } = renderHook(() => usePriceData(new Date()))

    return result.current.createPriceData(prices).map((price) => price.priceId)
}

describe('usePriceData', () => {
    describe('createPriceData', () => {
        test('should draw live prices and the today row from oldest to newest', () => {
            const prices = [createPrice(3, { today: true }), createPrice(3), createPrice(2), createPrice(1)]

            expect(getChartPriceIds(prices)).toEqual([1, 2, 3, 3])
        })

        test('should draw prices without a today row when no price has started', () => {
            expect(getChartPriceIds([createPrice(2), createPrice(1)])).toEqual([1, 2])
        })

        test('should leave out deleted prices', () => {
            const prices = [
                createPrice(3, { today: true }),
                createPrice(3),
                createPrice(2, { deletedAt }),
                createPrice(1)
            ]

            expect(getChartPriceIds(prices)).toEqual([1, 3, 3])
        })

        test('should draw nothing when every price is deleted', () => {
            const prices = [
                createPrice(2, { today: true, deletedAt }),
                createPrice(2, { deletedAt }),
                createPrice(1, { deletedAt })
            ]

            expect(getChartPriceIds(prices)).toEqual([])
        })
    })
})
