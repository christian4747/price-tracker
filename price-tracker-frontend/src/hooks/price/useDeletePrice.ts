import type { PriceType } from '../../utils/Types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'

export function useDeletePrice(price: PriceType) {

    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for deleting prices
    const deletePriceMutation = useMutation({
        mutationFn: () => {
            return api.deletePrice(price.priceId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                predicate: (query) => {
                    return (query.queryKey[0] as string) === 'products' || (query.queryKey[0] as string) === 'productsGrouped'
                }
            })
        },
        onError: (error) => {
            console.log(`Error occurred while deleting ${price.priceId}: ${price.amount} ${price.priceStarted} (${error.message})`)
        }
    })

    const useDeletePriceProps = {
        mutation: deletePriceMutation
    }

    return useDeletePriceProps
}