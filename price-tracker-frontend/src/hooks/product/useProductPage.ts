import productService from '@/services/productService'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useListWithPagination } from '@/hooks/common/useListWithPagination'
import type { ProductFilterDTO } from '@/types/product'

export function useProductPage(pageNumber: number = 1, pageSize: number = 10, productFilterDTO: ProductFilterDTO) {
    const {
        changePageNumber,
        currentlyOpened,
        currentPageNumber,
        currentPageSize,
        setCurrentlyOpened,
        setCurrentPageNumber
    } = useListWithPagination(pageNumber, pageSize)

    // Query for getting a product page. The key includes every request input so changing one refetches.
    const productPageQuery = useQuery({
        queryKey: ['products', currentPageNumber - 1, currentPageSize, productFilterDTO],
        queryFn: () => {
            return productService.getProductPage(currentPageNumber - 1, currentPageSize, productFilterDTO)
        },
        throwOnError: true,
        placeholderData: keepPreviousData
    })

    const useProductPageProps = {
        changePageNumber: changePageNumber,
        currentlyOpened: currentlyOpened,
        currentPageNumber: currentPageNumber,
        query: productPageQuery,
        setCurrentlyOpened: setCurrentlyOpened,
        setCurrentPageNumber: setCurrentPageNumber
    }

    return useProductPageProps
}
