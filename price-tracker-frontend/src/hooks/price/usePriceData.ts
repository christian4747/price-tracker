import { getLocalDateFromUTC, localizeFormatDayjs } from "@/utils/DateUtilities"
import { getBestDiscount, getPriceDiscount, getXYearAgoPrices, sortPricesByDateAscending } from "@/utils/PriceUtilities"
import type { PriceType } from "@/utils/Types"
import dayjs from "dayjs"

export function usePriceData(dateToday: Date) {

    // Create Price data for PriceHistoryChart
    const createPriceData = (prices: PriceType[]) => {
        const sortedPricesByDate = sortPricesByDateAscending(prices)

        if (!prices || prices.length <= 0) return []

        let todayFound = false
        let todayIndex = prices.length
        const priceData = sortedPricesByDate
            .map((price, idx) => {
                if (getLocalDateFromUTC(new Date(price.priceStarted)).toDate().getTime() > dateToday.getTime() && todayFound === false) {
                    todayFound = true
                    todayIndex = idx
                }

                return {
                    priceId: price.priceId,
                    priceStarted: localizeFormatDayjs(getLocalDateFromUTC(new Date(price.priceStarted)), 'lll'),
                    price: price.amount,
                    description: price.description,
                    currency: price.currency
                }
            }
        )

        priceData.splice(todayIndex, 0,
            {
                priceId: -1,
                priceStarted: 'Now',
                price: sortedPricesByDate[todayIndex - 1].amount,
                description: sortedPricesByDate[todayIndex - 1].description,
                currency: sortedPricesByDate[todayIndex - 1].currency
            }
        )

        return priceData
    }

    // Get the first price after today
    const getLatestPriceAfterToday = (prices: PriceType[]) => {
        if (!prices || prices.length <= 0) return
        let latestPrice = prices[0]
        let today = dayjs(dateToday.getTime())
    
        for (const price of prices) {
            const currentPriceStarted = dayjs(price.priceStarted)
            if (currentPriceStarted.isAfter(today)) {
                latestPrice = price
                return latestPrice
            }
        }
    
        return undefined
    }
    
    // Get the first price before today
    const getLatestPriceBeforeToday = (prices: PriceType[]) => {
        if (!prices || prices.length <= 0) return
        let latestPrice = prices[0]
        let latest = dayjs(prices[0].priceStarted)
        let today = dayjs(dateToday.getTime())
    
        for (const price of prices) {
            const currentPriceStarted = dayjs(price.priceStarted)
            if (currentPriceStarted.isAfter(latest) && currentPriceStarted.isBefore(today)) {
                latest = currentPriceStarted
                latestPrice = price
            }
        }
    
        return latestPrice
    }

    // Returns the banner type by comparing the best discount and most recent discount
    const getBannerType = (prices: PriceType[]) => {
        if (!prices || prices.length <= 1) return ''
    
        const sortedPricesByDate = sortPricesByDateAscending(prices)
    
        const mostRecentPrice = getLatestPriceBeforeToday(prices)
        if (!mostRecentPrice) return ''
    
        const mostRecentDiscount = getPriceDiscount(prices, mostRecentPrice)
    
        const allTimeDiscount = getBestDiscount(sortedPricesByDate)
        const twoYearDiscount = getBestDiscount(getXYearAgoPrices(prices, 2))
        const oneYearDiscount = getBestDiscount(getXYearAgoPrices(prices, 1))
    
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

    const priceDataProps = {
        createPriceData: createPriceData,
        getLatestPriceAfterToday: getLatestPriceAfterToday,
        getLatestPriceBeforeToday: getLatestPriceBeforeToday,
        getBannerType: getBannerType
    }

    return priceDataProps
}