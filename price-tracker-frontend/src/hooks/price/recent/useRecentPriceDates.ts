import api from "@/services/api"
import { useQuery } from "@tanstack/react-query"

export function useRecentPriceDates() {

    // Query for getting a product page
    const recentPricesQuery = useQuery({
        queryKey: ['recentPrices'],
        queryFn: () => {
            return api.getRecentPriceDates()
        },
        throwOnError: true
    })

    const useRecentPriceDatesProps = {
        query: recentPricesQuery,
    }

    return useRecentPriceDatesProps
}