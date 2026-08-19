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

    // // Hook for getting products grouped
    // const getProductsGrouped = useGetProductsGrouped(activePage)

    // Sets the search term, triggering a filter and refresh
    const searchSearchTerm = (searchTerm: string) => {
        setSearchedTerm(searchTerm)
    }

    if (productsGroupBy !== '') {
        return (
            <>
                <div className="flex items-center gap-2 mb-3">
                    <div className="text-5xl">
                        My Products
                    </div>
                </div>

                <div className='border-t pb-0 mb-5 pt-3 border-smoke'>
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
                </div>
            </>
        )
    } else {
        return (
            <>
                <div className="flex items-center gap-2 mb-3">
                    <div className="text-5xl">
                        My Products
                    </div>
                </div>

                <div className='border-t pb-0 mb-5 pt-3 border-smoke'>
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
                </div>
            </>
        )
    }
}

export default ProductListContainer