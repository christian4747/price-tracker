import ProductList from '../product/ProductList'
import AddProductModal from '../modals/AddProductModal'
import ProductListHeader from '../product/ProductListHeader'
import { useAddProduct } from '../../../hooks/product/useAddProduct'
import { useGetAllProducts } from '../../../hooks/product/useGetAllProducts'
import { useState } from 'react'
import type { ProductType } from '../../../utils/Types'

const ProductListContainer = () => {

    const [searchTerm, setSearchTerm] = useState('')
    const [currentSearchTerm, setCurrentSearchTerm] = useState('')

    // Hook for adding products
    const addProduct = useAddProduct()
    // Hook for getting all products
    const getAllProducts = useGetAllProducts()

    const searchSearchTerm = (searchTerm: string) => {
        setCurrentSearchTerm(searchTerm)
    }

    if (getAllProducts.query.isPending) {
        return (
            <>
                <ProductListHeader
                    toggleAddProduct={addProduct.visibility.toggle}
                    getAllProducts={getAllProducts.refresh}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
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
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    searchSearchTerm={searchSearchTerm}
                />
                An error occurred: {getAllProducts.query.error.message}
            </>
        )
    }

    const filteredProducts = getAllProducts.query.data.filter((product: ProductType) => {
        return product.name.toLowerCase().includes(currentSearchTerm.toLowerCase())
    })

    return (
        <>
            <ProductListHeader
                toggleAddProduct={addProduct.visibility.toggle}
                getAllProducts={getAllProducts.refresh}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
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