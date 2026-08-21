import type { ProductType } from '../../utils/Types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'

export function useDeleteProduct(product: ProductType) {
    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for deleting products
    const deleteProductMutation = useMutation({
        mutationFn: () => {
            return api.deleteProduct(product.productId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                predicate: (query) => {
                    return (query.queryKey[0] as string).includes('product')
                }
            })
        },
        onError: (error) => {
            console.log(`Error occurred while deleting ${product.productId}: ${product.name} (${error.message})`)
        }
    })
    
    const useDeleteProductProps = {
        mutation: deleteProductMutation
    }

    return useDeleteProductProps
}