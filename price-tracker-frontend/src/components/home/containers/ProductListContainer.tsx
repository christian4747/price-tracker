import ProductList from '../product/ProductList'
import AddProductModal from '../modals/AddProductModal'
import ProductListHeader from '../product/ProductListHeader'
import { useAddProduct } from '../../../hooks/useAddProduct'
import { useGetAllProducts } from '../../../hooks/useGetAllProducts'

const ProductListContainer = () => {

    // Hook for adding products
    const addProduct = useAddProduct()
    // Hook for getting all products
    const getAllProducts = useGetAllProducts()

    if (getAllProducts.query.isPending) {
        return (
            <>
                <ProductListHeader
                    toggleAddProduct={addProduct.visibility.toggle}
                    getAllProducts={getAllProducts.refresh}
                />
                Loading...
            </>
        )
    }

    if (getAllProducts.query.isError) {
        return (
            <>
                <ProductListHeader
                    toggleAddProduct={addProduct.visibility.toggle}
                    getAllProducts={getAllProducts.refresh}
                />
                An error occurred: {getAllProducts.query.error.message}
            </>
        )
    }

    return (
        <>
            <ProductListHeader
                toggleAddProduct={addProduct.visibility.toggle}
                getAllProducts={getAllProducts.refresh}
            />
            {getAllProducts.query.isSuccess && (
                <ProductList
                    products={getAllProducts.query.data}
                />
            )}
            <AddProductModal
                hidden={addProduct.visibility.value}
                toggleHidden={addProduct.visibility.toggle}
                product={addProduct.productDTO.value}
                addProduct={addProduct.mutation.mutate}
                setProductDTO={addProduct.productDTO.setProductDTO}
            />
        </>
    )
}

export default ProductListContainer