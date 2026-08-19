import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'

export function useGetProductsGrouped() {

    // Query for getting all the products
    const allProductsQuery = useQuery({
        queryKey: ['products'],
        queryFn: api.getProductsGrouped
    })

    const useGetProductsGroupedProps = {
        query: allProductsQuery
    }

    return useGetProductsGroupedProps
}