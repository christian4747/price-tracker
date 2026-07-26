import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { useToggleVisibility } from './useToggleVisibility'
import { useProductDTO } from './useProductDTO'

export function useAddProduct() {
    // State for AddProductModal visibility
    const showAddProduct = useToggleVisibility(false)

    // State for ProductDTO used in adding products
    const productDTO = useProductDTO(
        {
            name: '',
            link: '',
            store: ''
        }
    )

    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for adding new products
    const addProductMutation = useMutation({
        mutationFn: () => {
            showAddProduct.toggle()
            return api.addProduct(productDTO.value)
        },
        onSuccess: (newData: any) => {
            queryClient.setQueryData(['products'], (oldData: any) => {
                return oldData ? [...oldData, newData] : []
            })
        },
        onError: (error) => {
            console.log(`Error occurred while adding ${productDTO.value.name} (${error.message})`)
        }
    })

    const useAddProductProps = {
        visibility: showAddProduct,
        mutation: addProductMutation,
        productDTO: productDTO
    }

    return useAddProductProps
}