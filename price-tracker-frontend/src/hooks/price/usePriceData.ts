import { getLocalDateFromUTC, localizeFormatDayjs } from '@/utils/dateUtils'
import type { PriceType } from '@/types/price'

export function usePriceData() {
    // Create Price data for PriceHistoryChart
    const createPriceData = (prices: PriceType[]) => {
        if (!prices || prices.length <= 0) return []

        // Deleted prices can be in the list when the price list is showing them, but the chart only draws live prices
        const livePrices = prices.filter((price) => price.deletedAt === null)

        const priceData = livePrices.map((price, idx) => {
            price = livePrices[livePrices.length - 1 - idx]

            if (price.today) {
                return {
                    priceId: price.priceId,
                    totalAmount: price.totalAmount,
                    description: price.description,
                    currency: price.currency,
                    today: price.today,
                    priceStarted: 'Now'
                }
            }

            return {
                priceId: price.priceId,
                totalAmount: price.totalAmount,
                description: price.description,
                currency: price.currency,
                today: price.today,
                priceStarted: localizeFormatDayjs(getLocalDateFromUTC(new Date(price.priceStarted)), 'lll')
            }
        })

        return priceData
    }

    // Which low a price is at comes from the backend's priceCategory, so the chart data is all this hook makes
    const priceDataProps = {
        createPriceData: createPriceData
    }

    return priceDataProps
}
