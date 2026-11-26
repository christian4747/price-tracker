import type { PriceType } from '@/types/price'
import { getFormattedDateString, getFormattedDateTimeString, getLocalDateFromUTC } from './dateUtils'
import { getAmountString, getPercentage } from './priceUtils'

// Differences smaller than half a cent are floating-point leftovers, not a discount or a return
const HALF_CENT = 0.005

/**
 * Get the details line shown under a price's date: the base price, discount, return, and description, each only when
 * it applies, joined with " · ". The end date is left out: the next price's row already shows when the price changed,
 * and today's price goes by start dates only, so an end date could say a sale ended while it's still in effect (#287).
 * @param price The price to describe
 * @returns The details, or an empty string for a plain full price
 */
const getPriceDetailsString = (price: PriceType) => {
    const currency = price.currency
    const discounted = price.amount > 0 && price.amount - price.discountAmount >= HALF_CENT
    const returned = price.returnAmount >= HALF_CENT
    const description = price.description?.trim()
    const parts: string[] = []

    if (discounted || returned) parts.push(`${getAmountString(price.amount, currency)} base`)
    if (discounted) parts.push(`${getPercentage(1 - price.discountAmount / price.amount)}% off`)
    if (returned) parts.push(`${getAmountString(price.returnAmount, currency)} back`)
    if (description) parts.push(description)

    return parts.join(' · ')
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
        const currency = price.currency
        if (previous === undefined || previous.currency !== currency) return

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

/**
 * Get the price Quick Price fills the add price form from: the newest listed price, which is the top row of the list.
 * The list is already newest first by start date, with prices that start together in the order the backend breaks the
 * tie, so the first price that counts is the newest. Deleted prices (listed while Show deleted prices is on) and
 * today's entry (a copy of the price in effect now, starting now) don't count.
 * @param prices The prices in the list, newest first
 * @returns The newest live price, or undefined when every listed price is deleted
 */
const getQuickAddPrice = (prices: PriceType[]) => prices.find((price) => price.deletedAt === null && !price.today)

export {
    getPriceChanges,
    getPriceDateString,
    getPriceDetailsString,
    getPriceRowDateString,
    getPriceTimeline,
    getQuickAddPrice,
    getSameDayPriceIds
}
export type { PriceChange, PriceTimeline }
