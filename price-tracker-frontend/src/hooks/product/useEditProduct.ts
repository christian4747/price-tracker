import type { ProductType } from '../../utils/Types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useProductDTO } from './useProductDTO'
import { sendSuccessNotification } from '@/utils/NotificationUtilities'

export function useEditProduct(product: ProductType) {

    // State for ProductDTO when editing Products
    const productDTO = useProductDTO(
        {
            name: product.name,
            store: product.store,
            link: product.link,
            active: product.active
        }
    )

    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for editing products
    const editProductMutation = useMutation({
        mutationFn: () => {
            return api.editProduct(product.productId, productDTO.value)
        },
        onSuccess: (newProduct: ProductType) => {
            queryClient.invalidateQueries({
                predicate: (query) => {
                    return (query.queryKey[0] as string) === 'products' || (query.queryKey[0] as string) === 'productsGrouped'
                }
            })
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