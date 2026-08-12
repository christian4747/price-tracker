import ProductList from '../product/ProductList'
import ProductListHeader from '../product/ProductListHeader'
import { useGetAllProducts } from '../../../hooks/product/useGetAllProducts'
import { useState } from 'react'
import type { ProductType } from '../../../utils/Types'
import { useDebounce } from '@/hooks/common/useDebounce'

const ProductListContainer = () => {

    const {value: dateToday, setValueWithDebounce: setDateToday} = useDebounce(new Date())

    // State for tracking current searched term
    const [searchedTerm, setSearchedTerm] = useState('')
    // State for filtering by product status
    const [productStatusFilter, setProductStatusFilter] = useState('Active')

    // Hook for getting all products
    const getAllProducts = useGetAllProducts()

    // Sets the search term, triggering a filter and refresh
    const searchSearchTerm = (searchTerm: string) => {
        setSearchedTerm(searchTerm)
    }

    if (getAllProducts.query.isPending) {
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
    } else if (getAllProducts.query.isError) {
        return (
            <>
                <div className="flex items-center gap-2 mb-3">
                    <div className="text-5xl">
                        My Products
                    </div>
                </div>
                An error occurred: {getAllProducts.query.error.message}
            </>
        )
    }

    // Product list with status filter applied
    const filterByStatus = getAllProducts.query.data.filter((product: ProductType) => {
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
                    getAllProducts={getAllProducts.refresh}
                    searchSearchTerm={searchSearchTerm}
                    productStatusFilter={productStatusFilter}
                    setProductStatusFilter={setProductStatusFilter}
                />
                {getAllProducts.query.isSuccess && (
                    <ProductList
                        products={filteredProducts}
                        dateToday={dateToday}
                        setDateToday={setDateToday}
                    />
                )}
            </div>
            
        </>
    )
}

export default ProductListContainer