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

export { getHighestPrice }