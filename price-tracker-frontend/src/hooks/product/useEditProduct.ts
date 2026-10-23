import type { ProductDTO, ProductType } from '@/utils/Types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import productService from '@/services/productService'
import { useProductDTO } from '@/hooks/product/useProductDTO'
import { sendSuccessNotification } from '@/utils/NotificationUtilities'

export function useEditProduct(product: ProductType) {
    // State for ProductDTO when editing Products
    const productDTO = useProductDTO(product as ProductDTO)

    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for editing products
    const editProductMutation = useMutation({
        mutationFn: () => {
            return productService.editProduct(product.productId, productDTO.value)
        },
        onSuccess: (newProduct: ProductType) => {
            queryClient.invalidateQueries()
            sendSuccessNotification(`Successfully edited product ${newProduct.name}`)
        },
        onError: (error) => {
            console.log(`Error occurred while updating ${product.productId}: ${product.name} (${error.message})`)
        }
    })

    const useEditProductProps = {
        mutation: editProductMutation,
        productDTO: productDTO
    }

    return useEditProductProps
}
