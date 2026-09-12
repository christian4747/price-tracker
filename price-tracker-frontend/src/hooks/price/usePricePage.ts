import api from "@/services/api"
import { keepPreviousData, useQuery } from "@tanstack/react-query"

export function usePricePage(productId: number) {

    // Query for getting a price page
    const productPageQuery = useQuery({
        queryKey: ['prices', productId],
        queryFn: () => {
            return api.getPrices(productId)
        },
        throwOnError: true,
        placeholderData: keepPreviousData
    })

    const useProductPageProps = {
        query: productPageQuery
    }

    return useProductPageProps
}