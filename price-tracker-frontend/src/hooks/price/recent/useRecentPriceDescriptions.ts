import api from "@/services/api"
import { useQuery } from "@tanstack/react-query"

export function useRecentPriceDescriptions() {

    // Query for getting a product page
    const recentPricesQuery = useQuery({
        queryKey: ['recentDescriptions'],
        queryFn: () => {
            return api.getRecentPriceDescriptions()
        },
        throwOnError: true
    })

    const useRecentPriceDescriptionsProps = {
        query: recentPricesQuery,
    }

    return useRecentPriceDescriptionsProps
}