import ProductList from '../product/ProductList'
import AddProductModal from '../modals/AddProductModal'
import ProductListHeader from '../product/ProductListHeader'
import { useAddProduct } from '../../../hooks/product/useAddProduct'
import { useGetAllProducts } from '../../../hooks/product/useGetAllProducts'
import { useState } from 'react'
import type { ProductType } from '../../../utils/Types'

const ProductListContainer = () => {

    // State for tracking current input value
    const [currentSearchTerm, setCurrentSearchTerm] = useState('')
    // State for tracking current searched term
    const [searchedTerm, setSearchedTerm] = useState('')

    // Hook for adding products
    const addProduct = useAddProduct()
    // Hook for getting all products
    const getAllProducts = useGetAllProducts()

    // Sets the search term, triggering a filter and refresh
    const searchSearchTerm = (searchTerm: string) => {
        setSearchedTerm(searchTerm)
    }

    if (getAllProducts.query.isPending) {
        return (
            <>
                <ProductListHeader
                    toggleAddProduct={addProduct.visibility.toggle}
                    getAllProducts={getAllProducts.refresh}
                    currentSearchTerm={currentSearchTerm}
                    setCurrentSearchTerm={setCurrentSearchTerm}
                    searchSearchTerm={searchSearchTerm}
                />
                Loading...
            </>
        )
    } else if (getAllProducts.query.isError) {
        return (
            <>
                <ProductListHeader
                    toggleAddProduct={addProduct.visibility.toggle}
                    getAllProducts={getAllProducts.refresh}
                    currentSearchTerm={currentSearchTerm}
                    setCurrentSearchTerm={setCurrentSearchTerm}
                    searchSearchTerm={searchSearchTerm}
                />
                An error occurred: {getAllProducts.query.error.message}
            </>
        )
    }

    // Product list with search term filter applied
    const filteredProducts = getAllProducts.query.data.filter((product: ProductType) => {
        return product.name.toLowerCase().includes(searchedTerm.toLowerCase())
    })

    return (
        <>
            <ProductListHeader
                toggleAddProduct={addProduct.visibility.toggle}
                getAllProducts={getAllProducts.refresh}
                currentSearchTerm={currentSearchTerm}
                setCurrentSearchTerm={setCurrentSearchTerm}
                searchSearchTerm={searchSearchTerm}
            />
            {getAllProducts.query.isSuccess && (
                <ProductList
                    products={filteredProducts}
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