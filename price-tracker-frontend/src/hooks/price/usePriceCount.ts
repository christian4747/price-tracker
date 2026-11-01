import priceService from '@/services/priceService'
import { useQuery } from '@tanstack/react-query'

export function usePriceCount(productId: number, enabled: boolean) {
    // Query for counting all of a product's prices, including deleted ones
    const priceCountQuery = useQuery<number>({
        queryKey: ['prices', productId, 'count'],
        queryFn: () => {
            return priceService.getPriceCount(productId)
        },
        enabled: enabled
    })

    const usePriceCountProps = {
        query: priceCountQuery
    }

    return usePriceCountProps
}
