import { keepPreviousData, useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { useListWithPagination } from '../common/useListWithPagination'

export function useGetProductsGrouped(pageNumber: number = 1, pageSize: number = 10) {

    const {
        changePageNumber,
        currentlyOpened,
        currentPageNumber,
        currentPageSize,
        setCurrentlyOpened,
        setCurrentPageNumber
    } = useListWithPagination(pageNumber, pageSize)

    // Query for getting all the products
    const getProductsGroupedQuery = useQuery({
        queryKey: ['productsGrouped', currentPageNumber - 1],
        queryFn: () => {
            return api.getProductsGrouped(currentPageNumber - 1, currentPageSize)
        },
        placeholderData: keepPreviousData
    })

    const useGetProductsGroupedProps = {
        changePageNumber: changePageNumber,
        currentlyOpened: currentlyOpened,
        currentPageNumber: currentPageNumber,
        query: getProductsGroupedQuery,
        setCurrentlyOpened: setCurrentlyOpened,
        setCurrentPageNumber: setCurrentPageNumber
    }

    return useGetProductsGroupedProps
}