import type { ProductType } from '@/types/product'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import productService from '@/services/productService'
import { sendSuccessNotification } from '@/utils/notificationUtils'

export function useRestoreProduct(product: ProductType) {
    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for restoring deleted products
    const restoreProductMutation = useMutation({
        mutationFn: () => {
            return productService.restoreProduct(product.productId)
        },
        onSuccess: (restoredProduct: ProductType) => {
            queryClient.invalidateQueries()
            sendSuccessNotification(`Successfully restored product ${restoredProduct.name}`)
        },
        onError: (error) => {
            console.log(`Error occurred while restoring ${product.productId}: ${product.name} (${error.message})`)
        }
    })

    const useRestoreProductProps = {
        mutation: restoreProductMutation
    }

    return useRestoreProductProps
}
