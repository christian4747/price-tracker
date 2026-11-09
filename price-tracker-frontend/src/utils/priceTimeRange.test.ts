import { describe, expect, test } from 'vitest'
import { getPriceTimeRangeStart } from './priceTimeRange'

// Built from local times so the expected dates don't depend on the test machine's time zone
const afternoon = new Date(2026, 10, 9, 15, 30)

describe('getPriceTimeRangeStart', () => {
    test('should start 1 year at midnight a year before', () => {
        expect(getPriceTimeRangeStart('oneYear', afternoon)).toEqual(new Date(2025, 10, 9))
    })

    test('should start 2 years at midnight two years before', () => {
        expect(getPriceTimeRangeStart('twoYears', afternoon)).toEqual(new Date(2024, 10, 9))
    })

    test('should have no start for All', () => {
        expect(getPriceTimeRangeStart('all', afternoon)).toBeUndefined()
    })

    test('should start a year before a leap day on the last day of February', () => {
        expect(getPriceTimeRangeStart('oneYear', new Date(2028, 1, 29, 12))).toEqual(new Date(2027, 1, 28))
    })
})
