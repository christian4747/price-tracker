import api from "@/services/api"
import { useQuery } from "@tanstack/react-query"

export function usePricePage(productId: number) {

    // Query for getting a product page
    const productPageQuery = useQuery({
        queryKey: ['prices', productId],
        queryFn: () => {
            return api.getPrices(productId)
        },
        throwOnError: true
    })

    const useProductPageProps = {
        query: productPageQuery
    }

    return useProductPageProps
}