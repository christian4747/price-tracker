import GroupedProductList from '../product/GroupedProductList'
import ProductList from '../product/ProductList'
import ProductListHeader from '../product/ProductListHeader'
import { useState } from 'react'

const ProductListContainer = () => {

    // State for tracking current searched term
    const [searchedTerm, setSearchedTerm] = useState('')
    // State for filtering by product status
    const [productStatusFilter, setProductStatusFilter] = useState('Active')
    // State for tracking group by
    const [productsGroupBy, setProductsGroupBy] = useState('')

    // Sets the search term, triggering a filter and refresh
    const searchSearchTerm = (searchTerm: string) => {
        setSearchedTerm(searchTerm)
    }

    if (productsGroupBy !== '') {
        return (
            <>
                <ProductListHeader
                    searchSearchTerm={searchSearchTerm}
                    productStatusFilter={productStatusFilter}
                    setProductStatusFilter={setProductStatusFilter}
                    productsGroupBy={productsGroupBy}
                    setProductsGroupBy={setProductsGroupBy}
                />

                <GroupedProductList
                    searchedTerm={searchedTerm}
                />
            </>
        )
    } else {
        return (
            <>
                <ProductListHeader
                    searchSearchTerm={searchSearchTerm}
                    productStatusFilter={productStatusFilter}
                    setProductStatusFilter={setProductStatusFilter}
                    productsGroupBy={productsGroupBy}
                    setProductsGroupBy={setProductsGroupBy}
                />

                <ProductList
                    searchedTerm={searchedTerm}
                    productStatusFilter={productStatusFilter}
                />
            </>
        )
    }
}

export default ProductListContainer