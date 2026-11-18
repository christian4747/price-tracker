// The space left below the lowest value and above the highest, as a share of the spread between them, so the line
// doesn't run along the chart's edges
const PADDING = 0.1

// Round step sizes to pick from, scaled by powers of ten: 1, 2, 2.5, 5, then 10, 20, 25, 50, and so on
const NICE_STEPS = [1, 2, 2.5, 5, 10]

// About how many steps the spread should take up. With padding and rounding, this gives three to six ticks.
const TARGET_STEPS = 3

// The height given to a price that never changes, as a share of the price, so its flat line sits mid-chart
const FLAT_SPREAD = 0.2

// The smallest spread the scale fits, as a share of the highest value, so a change of a dollar on a pricier product
// takes a small part of the chart instead of all of it
const MIN_SPREAD = 0.05

type PriceChartScaleOptions = {
    // The smallest spread to fit, as a share of the highest value; 0 fits the prices as tightly as the padding allows
    minSpread?: number
}

type PriceChartScale = {
    min: number
    max: number
    // The values to label, from min to max in equal steps
    ticks: number[]
    step: number
}

/**
 * Get the smallest round step that's at least the given size, such as 50 for 39.85 or 0.1 for 0.067.
 * @param rawStep The step size the spread would need to fill the target number of steps
 * @returns The round step
 */
const getNiceStep = (rawStep: number) => {
    // The power of ten at or below the raw step, so 39.85 gives 10 and 0.067 gives 0.01
    const magnitude = 10 ** Math.floor(Math.log10(rawStep))
    const nice = NICE_STEPS.find((candidate) => candidate * magnitude >= rawStep)!
    return nice * magnitude
}

/**
 * Get how many decimals a step's multiples need, so rounding can strip floating-point leftovers like
 * 1.1000000000000001. A step of 50 needs none past one spare, 0.25 needs two.
 * @param step The step between ticks
 * @returns The number of decimals to keep
 */
const getStepDecimals = (step: number) => Math.max(0, -Math.floor(Math.log10(step))) + 1

/**
 * Get the price chart's y scale: a range fitted to the prices and the average with some space around them, rounded
 * out to whole steps so its labels are round amounts. Starting from the data instead of from zero spreads the line
 * over the chart's height, so a price change shows as a step of a visible size.
 * @param amounts The prices to fit
 * @param averagePrice The average line's amount, or null when there's none
 * @param options The smallest spread to fit, which defaults to MIN_SPREAD
 * @returns The scale, or null when there's nothing to fit
 */
const getPriceChartScale = (
    amounts: number[],
    averagePrice: number | null,
    { minSpread = MIN_SPREAD }: PriceChartScaleOptions = {}
): PriceChartScale | null => {
    // The average counts too, since a shorter time range can leave it above or below every price in view
    const values = averagePrice === null ? amounts : [...amounts, averagePrice]
    if (values.length === 0) return null

    let lowest = Math.min(...values)
    let highest = Math.max(...values)

    // The narrowest spread to fit. A price that never changes has no spread at all, so it always gets some height,
    // even without a minimum. A price of zero gets a spread of one, since a share of zero would still be zero.
    const narrowest = highest === lowest ? Math.abs(highest) * FLAT_SPREAD || 1 : Math.abs(highest) * minSpread

    // Widen a spread that's too narrow by the same amount on both sides, so the prices stay in the middle
    const shortfall = narrowest - (highest - lowest)
    if (shortfall > 0) {
        lowest -= shortfall / 2
        highest += shortfall / 2
    }

    const spread = highest - lowest
    const step = getNiceStep(spread / TARGET_STEPS)
    const decimals = getStepDecimals(step)

    // Count in whole steps from zero, so every tick is a multiple of the step. Prices aren't negative, so the range
    // stops at zero even when the padding would reach below it.
    const firstStep = Math.max(0, Math.floor((lowest - spread * PADDING) / step))
    const lastStep = Math.ceil((highest + spread * PADDING) / step)

    const ticks = Array.from({ length: lastStep - firstStep + 1 }, (_, index) =>
        Number(((firstStep + index) * step).toFixed(decimals))
    )

    return { min: ticks[0], max: ticks[ticks.length - 1], ticks, step }
}

/**
 * Get a tick's label: the amount in the product's currency, without cents when the step is a whole amount, since
 * every tick is then a whole amount too.
 * @param value The tick's amount
 * @param step The step between ticks
 * @param currency The product's currency code
 * @returns The label, such as $350 or $1.25
 */
const getPriceChartTickString = (value: number, step: number, currency: string) => {
    const digits = Number.isInteger(step) ? 0 : 2
    const options = { style: 'currency', minimumFractionDigits: digits, maximumFractionDigits: digits } as const
    try {
        return new Intl.NumberFormat(undefined, { ...options, currency }).format(value)
    } catch {
        // An unknown currency code throws, so fall back to dollars like the rest of the chart
        return new Intl.NumberFormat(undefined, { ...options, currency: 'USD' }).format(value)
    }
}

export { getPriceChartScale, getPriceChartTickString }
export type { PriceChartScale, PriceChartScaleOptions }
