import api from '../../../services/api'
import ProductList from '../product/ProductList'
import AddProductModal from '../modals/AddProductModal'
import { useToggleVisibility } from '../../../hooks/useToggleVisibility'
import { useProductDTO } from '../../../hooks/useProductDTO'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ProductDTO } from '../../../utils/Types'
import ProductListHeader from '../product/ProductListHeader'

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

    // Get the query client
    const queryClient = useQueryClient()

    // Query for getting all the products
    const {isPending, isSuccess, isError, data: products, error} = useQuery({
        queryKey: ['products'],
        queryFn: api.getAllProducts
    })

    // Mutation for adding new products
    const addProductMutation = useMutation({
        mutationFn: (newProduct: ProductDTO) => {
            showAddProduct.toggle()
            return api.addProduct(newProduct)
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

    if (isPending) {
        return (
            <>
                <ProductListHeader
                    toggleAddProduct={showAddProduct.toggle}
                    getAllProducts={() => {queryClient.invalidateQueries({queryKey: ['products']})}}
                />
                Loading...
            </>
        )
    }

    if (isError) {
        return (
            <>
                <ProductListHeader
                    toggleAddProduct={showAddProduct.toggle}
                    getAllProducts={() => {queryClient.invalidateQueries({queryKey: ['products']})}}
                />
                An error occurred: {error.message}
            </>
        )
    }

    return (
        <>
            <ProductListHeader
                toggleAddProduct={showAddProduct.toggle}
                getAllProducts={() => {queryClient.invalidateQueries({queryKey: ['products']})}}
            />
            {isSuccess && (
                <ProductList
                    products={products}
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