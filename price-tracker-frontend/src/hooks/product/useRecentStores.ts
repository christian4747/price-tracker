import productService from '@/services/productService'
import { useQuery } from '@tanstack/react-query'

export function useRecentStores(enabled: boolean = true) {
    // Query for getting recently used product stores
    const recentStoresQuery = useQuery<string[]>({
        queryKey: ['recentStores'],
        queryFn: () => {
            return productService.getRecentStores()
        },
        enabled: enabled,
        throwOnError: true
    })

    const useRecentStoresProps = {
        query: recentStoresQuery
    }

    return useRecentStoresProps
}
