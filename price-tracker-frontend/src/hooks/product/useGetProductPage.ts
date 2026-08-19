import api from "@/services/api"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useState } from "react"

export function useGetProductPage(pageNumber: number = 1, pageSize: number = 10) {

    // Current page state
    const [currentPageNumber, setCurrentPageNumber] = useState(pageNumber)
    // Current page size state
    const [currentPageSize, ] = useState(pageSize)

    // Query for getting all the products
    const productPageQuery = useQuery({
        queryKey: ['products', currentPageNumber - 1],
        queryFn: () => {
            return api.getProductPage(currentPageNumber - 1, currentPageSize)
        },
        placeholderData: keepPreviousData
    })

    const productCountQuery = useQuery({
        queryKey: ['productCount'],
        queryFn: () => {
            return api.getProductCount()
        }
    })

    const useGetProductPageProps = {
        query: productPageQuery,
        countQuery: productCountQuery,
        currentPageNumber: currentPageNumber,
        setCurrentPageNumber: setCurrentPageNumber,
    }

    return useGetProductPageProps
}