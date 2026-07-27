import type { ProductType } from '../../utils/Types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useToggleVisibility } from '../common/useToggleVisibility'

export function useDeleteProduct(product: ProductType) {
    // DeleteProductModal visibility
    const showDeleteProduct = useToggleVisibility(false)

    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for deleting products
    const deleteProductMutation = useMutation({
        mutationFn: () => {
            showDeleteProduct.toggle()
            return api.deleteProduct(product.productId)
        },
        onSuccess: () => {
            queryClient.setQueryData(['products'], (old: any) => {
                const idx = old.indexOf(product)
                return old.filter((p: ProductType, i: number) => {
                    if (i === idx) {
                        return
                    }
                    return p
                })
            })
        },
        onError: (error) => {
            console.log(`Error occurred while deleting ${product.productId}: ${product.name} (${error.message})`)
        }
    })
    
    const useDeleteProductProps = {
        visibility: showDeleteProduct,
        mutation: deleteProductMutation
    }

    return useDeleteProductProps
}