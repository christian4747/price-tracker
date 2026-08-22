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
                <div className="sticky top-0 pt-5 z-50 bg-white flex flex-col gap-2">
                    <div className="text-5xl">
                        My Products
                    </div>
                
                    <div className='border-t border-b pb-0 pt-3 border-smoke'>
                        <ProductListHeader
                            searchSearchTerm={searchSearchTerm}
                            productStatusFilter={productStatusFilter}
                            setProductStatusFilter={setProductStatusFilter}
                            productsGroupBy={productsGroupBy}
                            setProductsGroupBy={setProductsGroupBy}
                        />
                    </div>
                </div>

                <div className='mb-15'>
                    <GroupedProductList
                        searchedTerm={searchedTerm}
                    />
                </div>
            </>
        )
    } else {
        return (
            <>
                <div className="sticky top-0 pt-5 z-50 bg-white flex flex-col gap-2">
                    <div className="text-5xl">
                        My Products
                    </div>

                    <div className='border-t border-b pb-0 pt-3 border-smoke'>
                        <ProductListHeader
                            searchSearchTerm={searchSearchTerm}
                            productStatusFilter={productStatusFilter}
                            setProductStatusFilter={setProductStatusFilter}
                            productsGroupBy={productsGroupBy}
                            setProductsGroupBy={setProductsGroupBy}
                        />
                    </div>
                </div>

                <div className='mb-15'>
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