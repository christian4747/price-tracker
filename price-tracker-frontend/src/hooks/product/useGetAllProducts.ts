import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'

export function useGetAllProducts() {

    // Get the query client
    const queryClient = useQueryClient()

    // Query for getting all the products
    const allProductsQuery = useQuery({
        queryKey: ['products'],
        queryFn: api.getAllProducts
    })

    const refreshAllProducts = () => {
        queryClient.invalidateQueries({
            predicate: (query) => {
                return (query.queryKey[0] as string).includes('product')
            }
        })
    }

    const useGetAllProductsProps = {
        query: allProductsQuery,
        refresh: refreshAllProducts
    }

    return useGetAllProductsProps
}