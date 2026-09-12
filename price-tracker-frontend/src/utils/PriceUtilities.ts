import type { PriceType } from "./Types"

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

// Get the highest price from the price list
const getHighestPrice = (prices: PriceType[]) => {
    if (!prices || prices.length <= 0) return 0
    let highest = prices[0].amount

    for (const price of prices) {
        const priceVal = price.amount
        if (priceVal > highest) {
            highest = priceVal
        }
    }
    return highest
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

// Sort the given array by the given field (ascending)
const sortPricesByAmountAsc = (prices: PriceType[]) => {
    if (!prices || prices.length === 0) return []
    if (prices.length <= 1) return prices

    return prices.toSorted((a, b) => {
        return a.totalAmount - b.totalAmount
    })
}

// Create Price data for PriceHistoryChart
const createPriceData = (prices: PriceType[]) => {
    const sortedPricesByDate = sortPricesByDateAscending(prices)

    if (!prices || prices.length <= 0) return []

    let todayFound = false
    let todayIndex = prices.length
    const priceData = sortedPricesByDate
        .map((price, idx) => {
            if (Date.parse(price.priceStarted) > Date.now() && todayFound === false) {
                todayFound = true
                todayIndex = idx
            }

            return {
                priceId: price.priceId,
                priceStarted: new Date(price.priceStarted).toUTCString(),
                price: price.totalAmount,
                description: price.description
            }
        }
    )

    priceData.splice(todayIndex, 0,
        {
            priceId: -1,
            priceStarted: 'Now',
            price: sortedPricesByDate[todayIndex - 1].totalAmount,
            description: sortedPricesByDate[todayIndex - 1].description
        }
    )

    return priceData
}

// Gets the discount percentage for the most recent Price
const getMostRecentDiscount = (prices: PriceType[]) => {
    const sortedPricesByDate = sortPricesByDateAscending(prices)

    // Get the Product's Price(s) sorted by amount in ascending order
    const sortedByPrice = sortPricesByAmountAsc(prices)

    if (sortedByPrice.length <= 1 || sortedPricesByDate.length <= 1) return 0

    const highest = sortedByPrice[sortedByPrice.length - 1]
    const recent = sortedPricesByDate[sortedPricesByDate.length - 1]

    // console.log(highest.amount, recent.amount)
    return getPercentage(1 - (recent.totalAmount / highest.totalAmount))
}

// Get the most recent price from the price list
const getMostRecentPrice = (prices: PriceType[]) => {
    const sortedPricesByDate = sortPricesByDateAscending(prices)

    return sortedPricesByDate ? sortedPricesByDate[sortedPricesByDate.length - 1]?.totalAmount : ''
}

/**
 * Get the Price's total amount in the given currency format, default to USD.
 * @param price The price to format with currency
 * @returns The Price's total amount in the given currency format or an empty string
 */
const getPriceString = (price: PriceType | undefined) => {
    if (!price) return ''

    if (price.currency) {
        return new Intl.NumberFormat(undefined, { style: "currency", currency: price.currency }).format(price.totalAmount)
    } else {
        return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(price.totalAmount)
    }
}

export { 
    sortPricesByDateAscending,
    filterPricesBeforeDate,
    getHighestPrice,
    getPriceDiscount,
    getPercentage,
    getBestDiscount,
    getXYearAgoPrices,
    sortPricesByAmountAsc,
    createPriceData,
    getMostRecentDiscount,
    getMostRecentPrice,
    getPriceString
}