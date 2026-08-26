import api from "@/services/api"
import { useQuery } from "@tanstack/react-query"
import { useListWithPagination } from "../common/useListWithPagination"

export function useGetProductPage(pageNumber: number = 1, pageSize: number = 10) {

    const {
        changePageNumber,
        currentlyOpened,
        currentPageNumber,
        currentPageSize,
        setCurrentlyOpened,
        setCurrentPageNumber
    } = useListWithPagination(pageNumber, pageSize)

    // Query for getting all the products
    const productPageQuery = useQuery({
        queryKey: ['products', currentPageNumber - 1],
        queryFn: () => {
            return api.getProductPage(currentPageNumber - 1, currentPageSize)
        },
        throwOnError: true
    })

    const productCountQuery = useQuery({
        queryKey: ['productCount'],
        queryFn: () => {
            return api.getProductCount()
        },
        throwOnError: true
    })

    const useGetProductPageProps = {
        changePageNumber: changePageNumber,
        countQuery: productCountQuery,
        currentlyOpened: currentlyOpened,
        currentPageNumber: currentPageNumber,
        query: productPageQuery,
        setCurrentlyOpened: setCurrentlyOpened,
        setCurrentPageNumber: setCurrentPageNumber
    }

    return useGetProductPageProps
}