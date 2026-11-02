import productService from '@/services/productService'
import { useQuery } from '@tanstack/react-query'

export function useRecentBrands(enabled: boolean = true) {
    // Query for getting recently used product brands
    const recentBrandsQuery = useQuery<string[]>({
        queryKey: ['recentBrands'],
        queryFn: () => {
            return productService.getRecentBrands()
        },
        enabled: enabled,
        throwOnError: true
    })

    const useRecentBrandsProps = {
        query: recentBrandsQuery
    }

    return useRecentBrandsProps
}
