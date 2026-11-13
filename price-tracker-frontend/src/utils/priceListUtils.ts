import type { PriceType } from '@/types/price'
import { getFormattedDateString, getFormattedDateTimeString, getLocalDateFromUTC } from './dateUtils'
import { getAmountString, getPercentage } from './priceUtils'

// Differences smaller than half a cent are floating-point leftovers, not a discount or a return
const HALF_CENT = 0.005

/**
 * Get the details line shown under a price's date: the base price, discount, return, description, and end date, each
 * only when it applies, joined with " · ".
 * @param price The price to describe
 * @returns The details, or an empty string for a plain full price
 */
const getPriceDetailsString = (price: PriceType) => {
    const currency = price.currency || 'USD'
    const discounted = price.amount > 0 && price.amount - price.discountAmount >= HALF_CENT
    const returned = price.returnAmount >= HALF_CENT
    const description = price.description?.trim()
    const parts: string[] = []

    if (discounted || returned) parts.push(`${getAmountString(price.amount, currency)} base`)
    if (discounted) parts.push(`${getPercentage(1 - price.discountAmount / price.amount)}% off`)
    if (returned) parts.push(`${getAmountString(price.returnAmount, currency)} back`)
    if (description) parts.push(description)
    if (price.priceEnded) parts.push(`until ${getEndDateString(price.priceStarted, price.priceEnded)}`)

    return parts.join(' · ')
}

/**
 * Get when a price ends, for its details line: the time if it ends on the day it starts, since the row already shows
 * that date, or else the month and day, with the year only when it's in a different year from the start.
 * @param priceStarted When the price starts, in UTC
 * @param priceEnded When the price ends, in UTC
 * @returns The end time, or the end date
 */
const getEndDateString = (priceStarted: string, priceEnded: string) => {
    const started = getLocalDateFromUTC(new Date(priceStarted))
    const ended = getLocalDateFromUTC(new Date(priceEnded))

    if (ended.isSame(started, 'day')) return ended.format('h:mm A')
    return ended.format(ended.year() === started.year() ? 'MMM D' : 'MMM D, YYYY')
}

/**
 * Get how a price is named by its start in the price list: the date, or the date and time when another price in the
 * list starts on the same day.
 * @param price The price to name
 * @param showTime Whether another price in the list starts on the same day
 * @returns The formatted start date, with the time when asked for
 */
const getPriceDateString = (price: PriceType, showTime: boolean) => {
    return showTime ? getFormattedDateTimeString(price.priceStarted) : getFormattedDateString(price.priceStarted)
}

/**
 * Get the same name as getPriceDateString, with the date and the time each held together by non-breaking spaces, so a
 * narrow row can move the time to its own line without splitting either one.
 * @param price The price to name
 * @param showTime Whether another price in the list starts on the same day
 * @returns The formatted start date, with the time when asked for
 */
const getPriceRowDateString = (price: PriceType, showTime: boolean) => {
    /**
     * Swap each space for a non-breaking one, so the browser can't wrap the text partway through.
     * @param text The date or time to hold together
     * @returns The text with non-breaking spaces
     */
    const keepTogether = (text: string) => text.replaceAll(' ', ' ')
    const date = keepTogether(getFormattedDateString(price.priceStarted))
    if (!showTime) return date

    const time = getLocalDateFromUTC(new Date(price.priceStarted)).format('h:mm A')
    return `${date} ${keepTogether(time)}`
}

/**
 * Get the IDs of the listed prices that start on the same local day as another listed price. Today's entry, a copy of
 * the price in effect now that the list leaves out, doesn't count.
 * @param prices The prices in the list
 * @returns The IDs of the prices that share their start day with another price
 */
const getSameDayPriceIds = (prices: PriceType[]) => {
    const pricesByDay = new Map<string, number[]>()
    for (const price of prices) {
        if (price.today) continue
        const day = getLocalDateFromUTC(new Date(price.priceStarted)).format('YYYY-MM-DD')
        pricesByDay.set(day, [...(pricesByDay.get(day) ?? []), price.priceId])
    }

    return new Set([...pricesByDay.values()].filter((priceIds) => priceIds.length > 1).flat())
}

type PriceTimeline = {
    // The price in effect now, or null when no price has started yet
    currentPriceId: number | null
    // The prices that start after now, deleted ones included when they're shown
    upcomingPriceIds: Set<number>
}

/**
 * Get which listed price is in effect now and which haven't started yet. The backend marks the price in effect now by
 * adding a copy of it to the list, flagged as today's and starting at the moment the list was fetched, so that copy
 * gives both: its ID is the current price's, and its start is the "now" that later prices are upcoming from. Without
 * it, when no price has started, the current time is used instead.
 * @param prices The prices in the list
 * @returns The current price's ID and the upcoming prices' IDs
 */
const getPriceTimeline = (prices: PriceType[]): PriceTimeline => {
    const todayEntry = prices.find((price) => price.today)
    const now = todayEntry ? Date.parse(todayEntry.priceStarted) : Date.now()
    const upcomingPriceIds = new Set(
        prices.filter((price) => !price.today && Date.parse(price.priceStarted) > now).map((price) => price.priceId)
    )

    return { currentPriceId: todayEntry?.priceId ?? null, upcomingPriceIds }
}

type PriceChange = {
    direction: 'down' | 'up' | 'same'
    // Says what changed, such as "Down $4.00 from $80.00"
    label: string
}

/**
 * Get how each listed price changed from the price before it, by total. Deleted prices and today's entry (a copy of
 * the price in effect now, with the same ID) are skipped, and get no change. Neither does the oldest price, nor a price
 * whose previous price uses a different currency.
 * @param prices The prices in the list
 * @returns Each compared price's change, by price ID
 */
const getPriceChanges = (prices: PriceType[]) => {
    const changes = new Map<number, PriceChange>()
    // Oldest first, with prices that start together in the order they were added, as the backend orders them
    const comparedPrices = prices
        .filter((price) => price.deletedAt === null && !price.today)
        .toSorted((a, b) => Date.parse(a.priceStarted) - Date.parse(b.priceStarted) || a.priceId - b.priceId)

    comparedPrices.forEach((price, index) => {
        const previous = comparedPrices[index - 1]
        const currency = price.currency || 'USD'
        if (previous === undefined || (previous.currency || 'USD') !== currency) return

        // Compared to the cent, so floating-point leftovers don't show a change that isn't there
        const cents = Math.round(price.totalAmount * 100)
        const previousCents = Math.round(previous.totalAmount * 100)
        const difference = getAmountString(Math.abs(cents - previousCents) / 100, currency)
        const previousAmount = getAmountString(previous.totalAmount, currency)

        if (cents < previousCents) {
            changes.set(price.priceId, { direction: 'down', label: `Down ${difference} from ${previousAmount}` })
        } else if (cents > previousCents) {
            changes.set(price.priceId, { direction: 'up', label: `Up ${difference} from ${previousAmount}` })
        } else {
            changes.set(price.priceId, { direction: 'same', label: 'Same as the previous price' })
        }
    })

    return changes
}

export {
    getPriceChanges,
    getPriceDateString,
    getPriceDetailsString,
    getPriceRowDateString,
    getPriceTimeline,
    getSameDayPriceIds
}
export type { PriceChange, PriceTimeline }
