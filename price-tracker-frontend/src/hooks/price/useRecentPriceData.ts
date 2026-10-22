import priceService from '@/services/priceService'
import { useQuery } from '@tanstack/react-query'

export function useRecentPriceData(productId: number = -1) {
    // Query for getting recent price data
    const recentPricesQuery = useQuery({
        queryKey: ['recentPriceData'],
        queryFn: () => {
            return priceService.getRecentPriceData(productId)
        },
        throwOnError: true
    })

    const useRecentPriceDataProps = {
        query: recentPricesQuery
    }

    return useRecentPriceDataProps
}
