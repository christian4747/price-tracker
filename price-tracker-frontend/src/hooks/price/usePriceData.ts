import type { PriceType, ProductType } from '../../utils/Types'
import { filterPricesBeforeDate, getUSDateStringFromTimestamp, sortPricesByDateAscending } from '../../utils/DateUtilities'

export function usePriceData(product: ProductType) {

    // Get the Product's Price(s) sorted
    const sortedPricesByDate = sortPricesByDateAscending(product.prices)

    // Create Price data for PriceHistoryChart
    const createPriceData = () => {
        if (!product.prices || product.prices.length <= 0) return []

        const priceData = sortedPricesByDate
            .map((price) => {
                return {
                    priceId: price.priceId,
                    priceStarted: getUSDateStringFromTimestamp(price.priceStarted),
                    price: price.amount,
                    description: price.description
                }
            }
        )

        priceData.push(
            {
                priceId: -1,
                priceStarted: 'Today',
                price: sortedPricesByDate[sortedPricesByDate.length - 1].amount,
                description: sortedPricesByDate[sortedPricesByDate.length - 1].description
            }
        )

        return priceData
    }

    // Returns the banner type by comparing the best discount and most recent discount
    const getBannerType = () => {
        const mostRecentDiscount = getMostRecentDiscount()

        const allTimeDiscount = getBestDiscount(sortedPricesByDate)
        const twoYearDiscount = getBestDiscount(getXYearAgoPrices(2))
        const oneYearDiscount = getBestDiscount(getXYearAgoPrices(1))

        // console.log(allTimeDiscount, twoYearDiscount, oneYearDiscount, mostRecentDiscount)

        if (allTimeDiscount === mostRecentDiscount) {
            return 'all-time'
        } else if (twoYearDiscount === mostRecentDiscount) {
            return 'two-year'
        } else if (oneYearDiscount === mostRecentDiscount) {
            return 'one-year'
        }
        return ''
    }

    // Gets the best discount found in the array of Prices
    const getBestDiscount = (prices: PriceType[]) => {
        if (prices.length <= 1) return 0

        let lowest = parseFloat(prices[0].amount)
        let highest = parseFloat(prices[0].amount)
        let profit = highest - lowest

        for (const price of prices) {
            const priceVal = parseFloat(price.amount)
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

    // Gets the discount percentage for the most recent Price
    const getMostRecentDiscount = () => {
        // Get the Product's Price(s) sorted by amount in ascending order
        const sortedByPrice = sortPricesByAmountAsc()

        if (sortedByPrice.length <= 1 || sortedPricesByDate.length <= 1) return 0

        const highest = sortedByPrice[sortedByPrice.length - 1]
        const recent = sortedPricesByDate[sortedPricesByDate.length - 1]

        // console.log(highest.amount, recent.amount)
        return getPercentage(1 - (parseFloat(recent.amount) / parseFloat(highest.amount)))
    }

    const getMostRecentPrice = () => {
        return sortedPricesByDate ? sortedPricesByDate[sortedPricesByDate.length - 1]?.amount : ''
    }

    // Calculates the percentage from the given float
    // Percentages below 1 percent include 2 decimal points
    const getPercentage = (float: number) => {
        const percentage = parseFloat((float * 100).toFixed(2))
        return percentage > 1 ? Math.round(percentage) : percentage
    }

    // Get an array of Price(s) up to one year ago in ascending order
    const getXYearAgoPrices = (yearsAgo: number) => {
        const xYearAgo = new Date(Date.now())
        xYearAgo.setFullYear(xYearAgo.getFullYear() - yearsAgo)

        return sortPricesByDateAscending(filterPricesBeforeDate(product.prices, xYearAgo))
    }

    // Sort the given array by the given field (ascending)
    const sortPricesByAmountAsc = () => {
        if (!product.prices || product.prices.length === 0) return []
        if (product.prices.length <= 1) return product.prices

        return product.prices.toSorted((a, b) => {
            return parseFloat(a.amount) - parseFloat(b.amount)
        })
    }

    const usePriceDataProps = {
        createPriceData: createPriceData,
        getBannerType: getBannerType,
        getMostRecentPrice: getMostRecentPrice,
        getMostRecentDiscount: getMostRecentDiscount,
        sortedPricesByDate: sortedPricesByDate
    }

    return usePriceDataProps
}