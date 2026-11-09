import priceService from '@/services/priceService'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

export function useProductPrices(productId: number, showDeleted: boolean = false, startDate?: Date) {
    // Query for getting a product's prices. The key includes every request input so changing one refetches. While a
    // new time range loads, the previous prices stay shown. A failure is shown in the product's details rather than
    // thrown, so the rest of the product list keeps working.
    const pricesQuery = useQuery({
        queryKey: ['prices', productId, showDeleted, startDate?.toISOString()],
        queryFn: () => {
            return priceService.getPrices(productId, showDeleted, startDate)
        },
        placeholderData: keepPreviousData
    })

    return { query: pricesQuery }
}
