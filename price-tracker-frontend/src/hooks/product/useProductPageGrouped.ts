import { keepPreviousData, useQuery } from '@tanstack/react-query'
import productService from '@/services/productService'
import { useListWithPagination } from '@/hooks/common/useListWithPagination'
import type { ProductFilterDTO } from '@/types/product'

export function useProductPageGrouped(
    pageNumber: number = 1,
    pageSize: number = 10,
    productFilterDTO: ProductFilterDTO
) {
    const { changePageNumber, currentPageNumber, currentPageSize, setCurrentPageNumber } = useListWithPagination(
        pageNumber,
        pageSize,
        productFilterDTO
    )

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
        currentPageNumber: currentPageNumber,
        query: getProductsGroupedQuery,
        setCurrentPageNumber: setCurrentPageNumber
    }

    return useProductPageGroupedProps
}
