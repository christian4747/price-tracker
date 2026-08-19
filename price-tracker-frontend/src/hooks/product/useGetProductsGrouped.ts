import { keepPreviousData, useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { useState } from 'react'

export function useGetProductsGrouped(pageNumber: number = 1, pageSize: number = 10) {

    // Current page state
    const [currentPageNumber, setCurrentPageNumber] = useState(pageNumber)
    // Current page size state
    const [currentPageSize, ] = useState(pageSize)

    // Query for getting all the products
    const getProductsGroupedQuery = useQuery({
        queryKey: ['productsGrouped', currentPageNumber - 1],
        queryFn: () => {
            return api.getProductsGrouped(currentPageNumber - 1, currentPageSize)
        },
        placeholderData: keepPreviousData
    })

    const groupedProductCountQuery = useQuery({
        queryKey: ['productCount'],
        queryFn: () => {
            return api.getProductCount()
        }
    })

    const useGetProductsGroupedProps = {
        query: getProductsGroupedQuery,
        countQuery: groupedProductCountQuery,
        currentPageNumber: currentPageNumber,
        setCurrentPageNumber: setCurrentPageNumber,
    }

    return useGetProductsGroupedProps
}