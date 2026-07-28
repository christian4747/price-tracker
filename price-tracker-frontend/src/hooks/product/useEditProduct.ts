import type { ProductType } from '../../utils/Types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useToggleVisibility } from '../common/useToggleVisibility'
import { useProductDTO } from './useProductDTO'

export function useEditProduct(product: ProductType) {
    // EditProductModal visibility
    const showEditProduct = useToggleVisibility(false)

    // State for ProductDTO when editing Products
    const productDTO = useProductDTO(
        {
            name: product.name,
            store: product.store,
            link: product.link
        }
    )

    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for editing products
    const editProductMutation = useMutation({
        mutationFn: () => {
            showEditProduct.toggle()
            return api.editProduct(product.productId, productDTO.value)
        },
        onSuccess: (newData) => {
            queryClient.setQueryData(['products'], (old: any) => {
                const idx = old.indexOf(product)
                return old.map((p: ProductType, i: number) => {
                    if (i === idx) {
                        return newData
                    }
                    return p
                })
            })
        },
        onError: (error) => {
            console.log(`Error occurred while updating ${product.productId}: ${product.name} (${error.message})`)
        }
    })

    const useEditProductProps = {
        visibility: showEditProduct,
        mutation: editProductMutation,
        productDTO: productDTO
    }

    return useEditProductProps
}