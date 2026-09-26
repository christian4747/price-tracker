import api from "@/services/api"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useListWithPagination } from "../common/useListWithPagination"
import type { ProductFilterDTO } from "@/utils/Types"

export function useProductPage(pageNumber: number = 1, pageSize: number = 10, productFilterDTO: ProductFilterDTO) {

    const queryClient = useQueryClient()

    const {
        changePageNumber,
        currentlyOpened,
        currentPageNumber,
        currentPageSize,
        setCurrentlyOpened,
        setCurrentPageNumber
    } = useListWithPagination(pageNumber, pageSize)

    // Query for getting a product page
    const productPageQuery = useQuery({
        queryKey: ['products', currentPageNumber - 1],
        queryFn: () => {
            return api.getProductPage(currentPageNumber - 1, currentPageSize, productFilterDTO)
        },
        throwOnError: true
    })

    const refresh = () => {
        queryClient.invalidateQueries()
    }

    const useProductPageProps = {
        changePageNumber: changePageNumber,
        currentlyOpened: currentlyOpened,
        currentPageNumber: currentPageNumber,
        query: productPageQuery,
        setCurrentlyOpened: setCurrentlyOpened,
        setCurrentPageNumber: setCurrentPageNumber,
        refresh
    }

    return useProductPageProps
}