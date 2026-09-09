import { getLocalDateFromUTC, localizeFormatDayjs } from "@/utils/DateUtilities"
import { getBestDiscount, getPriceDiscount, getXYearAgoPrices, sortPricesByDateAscending } from "@/utils/PriceUtilities"
import type { PriceGraphData, PriceType } from "@/utils/Types"
import dayjs from "dayjs"

export function usePriceData(dateToday: Date) {

    // Create Price data for PriceHistoryChart
    const createPriceData = (prices: PriceGraphData[]) => {
        if (!prices || prices.length <= 0) return []

        const priceData = prices
            .map((price, idx) => {
                price = prices[prices.length - 1 - idx]

                if (price.today) {
                    return {
                        ...price,
                        priceStarted: "Now"
                    }
                }

                return {
                    ...price,
                    priceStarted: localizeFormatDayjs(getLocalDateFromUTC(new Date(price.priceStarted)), 'lll'),
                }
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
    
        const mostRecentDiscount = getPriceDiscount(mostRecentPrice)
    
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