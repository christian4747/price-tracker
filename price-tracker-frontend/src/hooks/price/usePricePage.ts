import priceService from '@/services/priceService'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'

export function usePricePage(productId: number, showDeleted: boolean = false) {
    const queryClient = useQueryClient()

    // Query for getting a price page
    const productPageQuery = useQuery({
        queryKey: ['prices', productId],
        queryFn: () => {
            return priceService.getPrices(productId, undefined, undefined, showDeleted)
        },
        throwOnError: true,
        placeholderData: keepPreviousData
    })

    const refresh = () => {
        queryClient.invalidateQueries()
    }

    const useProductPageProps = {
        query: productPageQuery,
        refresh: refresh
    }

    return useProductPageProps
}
