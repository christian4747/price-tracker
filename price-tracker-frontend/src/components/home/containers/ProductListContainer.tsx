import api from '../../../services/api'
import ProductList from '../product/ProductList'
import AddProductModal from '../modals/AddProductModal'
import { useToggleVisibility } from '../../../hooks/useToggleVisibility'
import { useProductDTO } from '../../../hooks/useProductDTO'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ProductDTO } from '../../../utils/Types'

const ProductListContainer = () => {
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

    const queryClient = useQueryClient()

    const {isPending, isSuccess, isError, data: products, error} = useQuery({
        queryKey: ['products'],
        queryFn: api.getAllProducts
    })

    const addProductMutation = useMutation({
        mutationFn: (newProduct: ProductDTO) => {
            showAddProduct.toggle()
            return api.addProduct(newProduct)
        },
        onSuccess: (newData: any) => {
            queryClient.setQueryData(['products'], (oldData: any) => {
                return oldData ? [...oldData, newData] : []
            })
        }
    })

    if (isPending) {
        return (
            <>Loading...</>
        )
    }

    if (isError) {
        return (
            <>An error occurred: {error}</>
        )
    }

    return (
        <>
            {isSuccess && (
                <ProductList
                    products={products}
                    toggleAddProduct={showAddProduct.toggle}
                    getAllProducts={() => {queryClient.invalidateQueries({queryKey: ['products']})}}
                />
            )}
            <AddProductModal
                hidden={showAddProduct.value}
                toggleHidden={showAddProduct.toggle}
                product={productDTO.value}
                addProduct={() => {addProductMutation.mutate(productDTO.value)}}
                setProductDTO={productDTO.setProductDTO}
            />
        </>
    )
}

export default ProductListContainer