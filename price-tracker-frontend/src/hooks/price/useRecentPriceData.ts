import api from "@/services/api"
import { useQuery } from "@tanstack/react-query"

export function useRecentPriceData() {

    // Query for getting recent price data
    const recentPricesQuery = useQuery({
        queryKey: ['recentPriceData'],
        queryFn: () => {
            return api.getRecentPriceData()
        },
        throwOnError: true
    })

    const useRecentPriceDataProps = {
        query: recentPricesQuery,
    }

    return useRecentPriceDataProps
}