import { useMutation, useQueryClient } from '@tanstack/react-query'
import productService from '@/services/productService'
import { useProductDTO } from '@/hooks/product/useProductDTO'
import { sendSuccessNotification } from '@/utils/NotificationUtilities'
import type { ProductType } from '@/utils/Types'
import { useState } from 'react'

export function useAddProduct() {

    // State for ProductDTO used in adding products
    const [emptyProductDTO,] = useState({
        name: '',
        link: '',
        store: '',
        active: true
    })

    const productDTO = useProductDTO(emptyProductDTO)

    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for adding new products
    const addProductMutation = useMutation({
        mutationFn: () => {
            return productService.addProduct(productDTO.value)
        },
        onSuccess: (newProduct: ProductType) => {
            queryClient.invalidateQueries()
            sendSuccessNotification(`Successfully added product ${newProduct.name}`)
        },
        onError: (error) => {
            console.log(`Error occurred while adding ${productDTO.value.name} (${error.message})`)
        }
    })

    const useAddProductProps = {
        mutation: addProductMutation,
        productDTO: productDTO
    }

    return useAddProductProps
}