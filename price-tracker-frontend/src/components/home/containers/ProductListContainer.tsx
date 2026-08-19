import ProductList from '../product/ProductList'
import ProductListHeader from '../product/ProductListHeader'
import { useState } from 'react'
import type { ProductType } from '../../../utils/Types'
import { useGetProductPage } from '@/hooks/product/useGetProductPage'

const ProductListContainer = () => {

    // State for tracking current searched term
    const [searchedTerm, setSearchedTerm] = useState('')
    // State for filtering by product status
    const [productStatusFilter, setProductStatusFilter] = useState('Active')
    // State for tracking group by
    const [productsGroupBy, setProductsGroupBy] = useState('')

    // // Hook for getting products grouped
    // const getProductsGrouped = useGetProductsGrouped(activePage)
    // Hook for regular product list pagination
    const getProductPage = useGetProductPage()

    // Sets the search term, triggering a filter and refresh
    const searchSearchTerm = (searchTerm: string) => {
        setSearchedTerm(searchTerm)
    }

    // if (productsGroupBy !== '') {
    //     console.log(productsGroupBy)
    //     if (getProductsGrouped.query.isPending) {
    //         return (
    //             <>
    //                 <div className="flex items-center gap-2 mb-3">
    //                     <div className="text-5xl">
    //                         My Products
    //                     </div>
    //                 </div>
    //                 Loading...
    //             </>
    //         )
    //     } else if (getProductsGrouped.query.isError) {
    //         return (
    //             <>
    //                 <div className="flex items-center gap-2 mb-3">
    //                     <div className="text-5xl">
    //                         My Products
    //                     </div>
    //                 </div>
    //                 An error occurred: {getProductsGrouped.query.error.message}
    //             </>
    //         )
    //     }

    //     // Product list with status filter applied
    //     const filterByStatus = getProductsGrouped.query.data.filter((product: ProductType) => {
    //         if (productStatusFilter === 'Active') {
    //             return product.active
    //         } else if (productStatusFilter === 'Inactive') {
    //             return !product.active
    //         } else {
    //             return true
    //         }
    //     })

    //     // Product list with search term filter applied
    //     const filteredProducts = filterByStatus.filter((product: ProductType) => {
    //         return product.name.toLowerCase().includes(searchedTerm.toLowerCase()) ||
    //             product.store.toLowerCase().includes(searchedTerm.toLowerCase())
    //     })

    //     return (
    //         <>
    //             <div className="flex items-center gap-2 mb-3">
    //                 <div className="text-5xl">
    //                     My Products
    //                 </div>
    //             </div>

    //             <div className='border-t pb-0 mb-5 pt-3 border-smoke'>
    //                 <ProductListHeader
    //                     searchSearchTerm={searchSearchTerm}
    //                     productStatusFilter={productStatusFilter}
    //                     setProductStatusFilter={setProductStatusFilter}
    //                     productsGroupBy={productsGroupBy}
    //                     setProductsGroupBy={setProductsGroupBy}
    //                 />
    //                 {getProductsGrouped.query.isSuccess && (
    //                     <GroupedProductList
    //                         groupedProducts={filteredProducts}
    //                     />
    //                 )}
    //             </div>
                
    //         </>
    //     )
    // } else {
        if (getProductPage.query.isPending) {
            return (
                <>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="text-5xl">
                            My Products
                        </div>
                    </div>
                    Loading...
                </>
            )
        } else if (getProductPage.query.isError) {
            return (
                <>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="text-5xl">
                            My Products
                        </div>
                    </div>
                    An error occurred: {getProductPage.query.error.message}
                </>
            )
        }

        // Product list with status filter applied
        const filterByStatus = getProductPage.query.data.filter((product: ProductType) => {
            if (productStatusFilter === 'Active') {
                return product.active
            } else if (productStatusFilter === 'Inactive') {
                return !product.active
            } else {
                return true
            }
        })

        // Product list with search term filter applied
        const filteredProducts = filterByStatus.filter((product: ProductType) => {
            return product.name.toLowerCase().includes(searchedTerm.toLowerCase()) ||
                product.store.toLowerCase().includes(searchedTerm.toLowerCase())
        })

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
                    {getProductPage.query.isSuccess && getProductPage.countQuery.isSuccess && (
                        <ProductList
                            productCount={getProductPage.countQuery.data}
                            products={filteredProducts}
                            currentPageNumber={getProductPage.currentPageNumber}
                            setCurrentPageNumber={getProductPage.setCurrentPageNumber}
                        />
                    )}
                </div>
                
            </>
        )
    // }
}

export default ProductListContainer