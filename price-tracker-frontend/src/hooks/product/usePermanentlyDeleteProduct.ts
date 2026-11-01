import type { ProductType } from '@/types/product'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import productService from '@/services/productService'
import { sendSuccessNotification } from '@/utils/notificationUtils'

export function usePermanentlyDeleteProduct(product: ProductType) {
    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for permanently deleting products that are already deleted
    const permanentlyDeleteProductMutation = useMutation({
        mutationFn: () => {
            return productService.permanentlyDeleteProduct(product.productId)
        },
        onSuccess: (removedProduct: ProductType) => {
            queryClient.invalidateQueries()
            sendSuccessNotification(`Successfully permanently deleted product ${removedProduct.name}`)
        },
        onError: (error) => {
            console.log(
                `Error occurred while permanently deleting ${product.productId}: ${product.name} (${error.message})`
            )
        }
    })

    const usePermanentlyDeleteProductProps = {
        mutation: permanentlyDeleteProductMutation
    }

    return usePermanentlyDeleteProductProps
}
