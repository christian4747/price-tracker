import priceService from '@/services/priceService'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

export function usePricePage(productId: number, showDeleted: boolean = false) {
    // Query for getting a price page. The key includes every request input so changing one refetches.
    const productPageQuery = useQuery({
        queryKey: ['prices', productId, showDeleted],
        queryFn: () => {
            return priceService.getPrices(productId, undefined, undefined, showDeleted)
        },
        throwOnError: true,
        placeholderData: keepPreviousData
    })

    const useProductPageProps = {
        query: productPageQuery
    }

    return useProductPageProps
}
