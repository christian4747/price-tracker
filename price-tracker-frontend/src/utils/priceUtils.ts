import type { PriceType } from '@/types/price'

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

/**
 * Calculates the percentage from the given float. Percentages below 1 percent include 2 decimal points.
 * @param float The float to convert to a percentage.
 * @returns The calculated percentage from the given float
 */
const getPercentage = (float: number) => {
    const percentage = parseFloat((float * 100).toFixed(2))
    return percentage > 1 ? Math.round(percentage) : percentage
}

// Gets the discount percentage for the given Price
const getPriceDiscount = (price: PriceType | undefined) => {
    if (!price) return 0

    return getPercentage(price.totalPercentage)
}

// Gets the best discount found in the array of Prices
const getBestDiscount = (prices: PriceType[]) => {
    if (!prices || prices.length <= 1) return 0

    let lowest = prices[0].totalAmount
    let highest = prices[0].totalAmount
    let profit = highest - lowest

    for (const price of prices) {
        const priceVal = price.totalAmount
        if (priceVal < lowest) {
            lowest = priceVal
            profit = highest - lowest
        } else if (priceVal > highest) {
            highest = priceVal
            profit = highest - lowest
        }
    }

    return getPercentage(profit / highest)
}

// Get an array of Price(s) up to one year ago in ascending order
const getXYearAgoPrices = (prices: PriceType[], yearsAgo: number) => {
    const xYearAgo = new Date(Date.now())
    xYearAgo.setFullYear(xYearAgo.getFullYear() - yearsAgo)

    return sortPricesByDateAscending(filterPricesBeforeDate(prices, xYearAgo))
}

/**
 * Get the Price's total amount in the given currency format, default to USD.
 * @param price The price to format with currency
 * @returns The Price's total amount in the given currency format or an empty string
 */
const getPriceString = (price: PriceType | undefined) => {
    if (!price) return ''

    if (price.currency) {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: price.currency }).format(
            price.totalAmount
        )
    } else {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(price.totalAmount)
    }
}

/**
 * Get the discounted amount for a base amount and discount percentage.
 * @param amount The base amount
 * @param discountPercentage The discount as a fraction (0.2 for 20%)
 * @returns The amount after the discount
 */
const getDiscountAmount = (amount: number, discountPercentage: number) => {
    return amount - amount * discountPercentage
}

/**
 * Get the return amount for a return percentage, based on the lower of the discounted and base amounts.
 * @param amount The base amount
 * @param discountAmount The amount after the discount
 * @param returnPercentage The return as a fraction (0.05 for 5%)
 * @returns The amount returned
 */
const getReturnAmount = (amount: number, discountAmount: number, returnPercentage: number) => {
    return Math.min(discountAmount, amount) * returnPercentage
}

export {
    sortPricesByDateAscending,
    filterPricesBeforeDate,
    getPriceDiscount,
    getPercentage,
    getBestDiscount,
    getXYearAgoPrices,
    getPriceString,
    getDiscountAmount,
    getReturnAmount
}
