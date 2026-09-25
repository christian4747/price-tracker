import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useListWithPagination } from '../common/useListWithPagination'
import type { ProductFilterDTO } from '@/utils/Types'

export function useProductPageGrouped(pageNumber: number = 1, pageSize: number = 10, productFilterDTO: ProductFilterDTO) {

    const queryClient = useQueryClient()

    const {
        changePageNumber,
        currentlyOpened,
        currentPageNumber,
        currentPageSize,
        setCurrentlyOpened,
        setCurrentPageNumber
    } = useListWithPagination(pageNumber, pageSize)

    // Query for getting a grouped product page
    const getProductsGroupedQuery = useQuery({
        queryKey: ['productsGrouped', currentPageNumber - 1],
        queryFn: () => {
            return api.getProductsGrouped(currentPageNumber - 1, currentPageSize, productFilterDTO)
        },
        throwOnError: true
    })

    const refresh = () => {
        queryClient.invalidateQueries()
    }

    const useProductPageGroupedProps = {
        changePageNumber: changePageNumber,
        currentlyOpened: currentlyOpened,
        currentPageNumber: currentPageNumber,
        query: getProductsGroupedQuery,
        setCurrentlyOpened: setCurrentlyOpened,
        setCurrentPageNumber: setCurrentPageNumber,
        refresh
    }

    return useProductPageGroupedProps
}