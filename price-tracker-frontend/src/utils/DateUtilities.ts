import type { PriceType } from "./Types"

// Converts backend Java timestamps to frontend timestamps
const javaTimestampToJS = (timestamp: string) => {
    return timestamp?.slice(0, -8)
}

// Returns the given timestamp as a US date
const getUSDateStringFromTimestamp = (timestamp: string) => {
    const priceStartedDate = new Date(timestamp)
    return `${priceStartedDate.getMonth() + 1}/${priceStartedDate.getDate()}/${priceStartedDate.getFullYear()}`
}

// Sorts the given PriceType array ascending by date
const sortPricesByDateAscending = (prices: PriceType[]) => {
    if (!prices) return []

    return prices.toSorted((a, b) => {
        return Date.parse(a.priceStarted) - Date.parse(b.priceStarted)
    })
}

// Filter Price(s) that occurred before the given date
const filterPricesBeforeDate = (prices: PriceType[], date: Date) => {
    if (!prices) return []

    const filter = Date.parse(date.toUTCString())

    return prices.filter((price) => {
        if (Date.parse(price.priceStarted) > filter) {
            return price
        }
    })
}

export { javaTimestampToJS, getUSDateStringFromTimestamp, sortPricesByDateAscending, filterPricesBeforeDate }