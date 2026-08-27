import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { useListWithPagination } from '../common/useListWithPagination'

export function useProductPageGrouped(pageNumber: number = 1, pageSize: number = 10) {

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
            return api.getProductsGrouped(currentPageNumber - 1, currentPageSize)
        },
        throwOnError: true
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