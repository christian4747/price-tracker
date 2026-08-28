import api from "@/services/api"
import { useQuery } from "@tanstack/react-query"

export function useRecentPriceCurrencies() {

    // Query for getting a product page
    const recentPricesQuery = useQuery({
        queryKey: ['recentCurrencies'],
        queryFn: () => {
            return api.getRecentPriceCurrencies()
        },
        throwOnError: true
    })

    const useRecentPriceCurrenciesProps = {
        query: recentPricesQuery,
    }

    return useRecentPriceCurrenciesProps
}