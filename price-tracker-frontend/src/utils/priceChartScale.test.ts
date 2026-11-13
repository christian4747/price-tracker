import { describe, expect, test } from 'vitest'
import { getPriceChartScale, getPriceChartTickString } from './priceChartScale'

// A spread like a real product's history: prices between about $286 and $406, with an average in between
const monitorPrices = [328.99, 336.99, 286.44, 352.99, 362.99, 321.29, 384.99, 405.99, 345.09]

/**
 * Get the gaps between neighbouring ticks, to check they're even.
 * @param ticks The tick values, lowest first
 * @returns Each tick's distance from the one before it
 */
const getTickGaps = (ticks: number[]) => ticks.slice(1).map((tick, index) => tick - ticks[index])

describe('getPriceChartScale', () => {
    test('should cover every price', () => {
        const scale = getPriceChartScale(monitorPrices, null)!

        expect(scale.min).toBeLessThanOrEqual(Math.min(...monitorPrices))
        expect(scale.max).toBeGreaterThanOrEqual(Math.max(...monitorPrices))
    })

    // A shorter time range can leave the whole history's average above or below every price in view
    test('should cover an average above every price', () => {
        const scale = getPriceChartScale([10, 20], 100)!

        expect(scale.max).toBeGreaterThanOrEqual(100)
    })

    test('should cover an average below every price', () => {
        const scale = getPriceChartScale([90, 100], 40)!

        expect(scale.min).toBeLessThanOrEqual(40)
    })

    // Starting from zero is what squeezed the line into a thin band, so a narrow spread far from zero shouldn't
    test('should start near the lowest price rather than at zero', () => {
        const scale = getPriceChartScale(monitorPrices, null)!

        expect(scale.min).toBeGreaterThan(200)
    })

    // Without space around the line, the lowest and highest prices would run along the chart's edges. Prices on round
    // amounts are used, since rounding out to whole steps would leave space around any others even without padding.
    test('should leave space below the lowest price and above the highest', () => {
        const scale = getPriceChartScale([300, 350, 400], null)!

        expect(scale.min).toBeLessThan(300)
        expect(scale.max).toBeGreaterThan(400)
    })

    test('should run its ticks from the bottom of the range to the top', () => {
        const { min, max, ticks } = getPriceChartScale(monitorPrices, null)!

        expect(ticks[0]).toBe(min)
        expect(ticks[ticks.length - 1]).toBe(max)
    })

    test('should space its ticks evenly', () => {
        const gaps = getTickGaps(getPriceChartScale(monitorPrices, null)!.ticks)

        for (const gap of gaps) expect(gap).toBeCloseTo(gaps[0], 10)
    })

    // Few enough labels to read at a glance, and enough to judge a step's size by
    test('should have between three and six ticks', () => {
        const { ticks } = getPriceChartScale(monitorPrices, null)!

        expect(ticks.length).toBeGreaterThanOrEqual(3)
        expect(ticks.length).toBeLessThanOrEqual(6)
    })

    // Labels like $250 and $300 read faster than $274.53 and $318.71
    test('should put its ticks on round amounts', () => {
        const { ticks } = getPriceChartScale(monitorPrices, null)!

        for (const tick of ticks) expect(tick % 50).toBe(0)
    })

    // Floating-point steps like 0.1 add up to 0.30000000000000004, which would show in a label
    test('should keep small steps free of floating-point leftovers', () => {
        const { ticks } = getPriceChartScale([1.1, 1.3, 1.2], null)!

        for (const tick of ticks) expect(tick).toBe(Number(tick.toFixed(2)))
    })

    test('should never go below zero', () => {
        const scale = getPriceChartScale([0.5, 3, 10], 4)!

        expect(scale.min).toBe(0)
    })

    // With no spread to fit, the range still needs some height, with the price in the middle
    test('should centre a price that never changes', () => {
        const { min, max } = getPriceChartScale([20, 20], 20)!

        expect(max).toBeGreaterThan(min)
        expect((min + max) / 2).toBe(20)
    })

    test('should give a price of zero a range with some height', () => {
        const { min, max } = getPriceChartScale([0, 0], null)!

        expect(min).toBe(0)
        expect(max).toBeGreaterThan(0)
    })

    test('should have no scale without prices or an average', () => {
        expect(getPriceChartScale([], null)).toBeNull()
    })
})

describe('getPriceChartScale minimum spread', () => {
    // Prices a dollar apart, which a fitted scale alone would stretch over the whole chart
    const closePrices = [218.99, 219.99, 219.49]

    // So a change of a dollar or so on a pricier product looks small, as it is, rather than like a big sale
    test('should widen a small spread to at least the minimum share of the highest price', () => {
        const { min, max } = getPriceChartScale(closePrices, null, { minSpread: 0.1 })!

        expect(max - min).toBeGreaterThanOrEqual(0.1 * 219.99)
    })

    // Widening only one side would push the line against the top or bottom of the chart
    test('should keep the prices in the middle of a widened range', () => {
        const { min, max } = getPriceChartScale(closePrices, null, { minSpread: 0.1 })!

        const middle = (219.49 - min) / (max - min)
        expect(middle).toBeGreaterThan(0.4)
        expect(middle).toBeLessThan(0.6)
    })

    test('should leave a spread wider than the minimum as it is', () => {
        expect(getPriceChartScale(monitorPrices, 356.5, { minSpread: 0.1 })).toEqual(
            getPriceChartScale(monitorPrices, 356.5, { minSpread: 0 })
        )
    })

    test('should fit a small spread tightly without a minimum', () => {
        const { min, max } = getPriceChartScale(closePrices, null, { minSpread: 0 })!

        expect(max - min).toBeLessThan(5)
    })

    // The chart uses the floor unless it asks for none, so the default has to be one. These prices give a different
    // scale with no floor, 5%, and 10%, so this pins down which one the default is.
    test('should use a minimum spread of 5% by default', () => {
        expect(getPriceChartScale(closePrices, null)).toEqual(
            getPriceChartScale(closePrices, null, { minSpread: 0.05 })
        )
    })
})

describe('getPriceChartTickString', () => {
    // The ticks are round, so cents would only make the labels longer
    test('should leave out cents for a whole-dollar step', () => {
        expect(getPriceChartTickString(350, 50, 'USD')).toBe('$350')
    })

    test('should show cents for a step smaller than a dollar', () => {
        expect(getPriceChartTickString(1.25, 0.25, 'USD')).toBe('$1.25')
    })

    test('should use the product currency', () => {
        expect(getPriceChartTickString(350, 50, 'EUR')).toBe('€350')
    })
})
