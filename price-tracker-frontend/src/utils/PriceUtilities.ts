import dayjs from "dayjs"
import type { PriceType } from "./Types"

// Get the highest price from the price list
const getHighestPrice = (prices: PriceType[]) => {
    if (!prices || prices.length <= 0) return 0
    let highest = parseFloat(prices[0].amount)

    for (const price of prices) {
        const priceVal = parseFloat(price.amount)
        if (priceVal > highest) {
            highest = priceVal
        }
    }
    return highest
}

// Get the date the price list was last updated
const getLatestUpdatedPrice = (prices: PriceType[]) => {
    if (!prices || prices.length <= 0) return 0
    let latest = dayjs(prices[0].updatedAt)

    for (const price of prices) {
        const currentUpdatedAt = dayjs(price.updatedAt)
        if (currentUpdatedAt.isAfter(latest)) {
            latest = currentUpdatedAt
        }
    }
    return latest
}

export { getHighestPrice, getLatestUpdatedPrice }