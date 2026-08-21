import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useProductDTO } from './useProductDTO'

export function useAddProduct() {

    // State for ProductDTO used in adding products
    const productDTO = useProductDTO(
        {
            name: '',
            link: '',
            store: '',
            active: true
        }
    )

    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for adding new products
    const addProductMutation = useMutation({
        mutationFn: () => {
            return api.addProduct(productDTO.value)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                predicate: (query) => {
                    return (query.queryKey[0] as string).includes('product')
                }
            })
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