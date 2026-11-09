import type { PriceTimeRange } from '@/types/price'
import dayjs from 'dayjs'

// The choices on the price chart, in the order they're shown
export const PRICE_TIME_RANGE_OPTIONS: { label: string; value: PriceTimeRange }[] = [
    { label: '1 year', value: 'oneYear' },
    { label: '2 years', value: 'twoYears' },
    { label: 'All', value: 'all' }
]

export const DEFAULT_PRICE_TIME_RANGE: PriceTimeRange = 'oneYear'

const YEARS_IN_RANGE: Record<PriceTimeRange, number | undefined> = {
    oneYear: 1,
    twoYears: 2,
    all: undefined
}

/**
 * Gets when a time range starts: midnight in local time, the range's number of years before the given date.
 * Starting at midnight keeps the start, and so the prices query, the same all day.
 * @param range The time range
 * @param date The date the range counts back from, usually today
 * @returns The start of the range, or undefined for All, which has no start
 */
export const getPriceTimeRangeStart = (range: PriceTimeRange, date: Date) => {
    const years = YEARS_IN_RANGE[range]
    if (years === undefined) return undefined

    return dayjs(date).subtract(years, 'year').startOf('day').toDate()
}
