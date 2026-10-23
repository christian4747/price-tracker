import { keepPreviousData, useQuery } from '@tanstack/react-query'
import productService from '@/services/productService'
import { useListWithPagination } from '@/hooks/common/useListWithPagination'
import type { ProductFilterDTO } from '@/types/product'

export function useProductPageGrouped(
    pageNumber: number = 1,
    pageSize: number = 10,
    productFilterDTO: ProductFilterDTO
) {
    const {
        changePageNumber,
        currentlyOpened,
        currentPageNumber,
        currentPageSize,
        setCurrentlyOpened,
        setCurrentPageNumber
    } = useListWithPagination(pageNumber, pageSize)

    // Query for getting a grouped product page. The key includes every request input so changing one refetches.
    const getProductsGroupedQuery = useQuery({
        queryKey: ['productsGrouped', currentPageNumber - 1, currentPageSize, productFilterDTO],
        queryFn: () => {
            return productService.getProductsGrouped(currentPageNumber - 1, currentPageSize, productFilterDTO)
        },
        throwOnError: true,
        placeholderData: keepPreviousData
    })

    const useProductPageGroupedProps = {
        changePageNumber: changePageNumber,
        currentlyOpened: currentlyOpened,
        currentPageNumber: currentPageNumber,
        query: getProductsGroupedQuery,
        setCurrentlyOpened: setCurrentlyOpened,
        setCurrentPageNumber: setCurrentPageNumber
    }

    return useProductPageGroupedProps
}
