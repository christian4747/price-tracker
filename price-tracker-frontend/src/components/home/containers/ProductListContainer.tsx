import { Box, Button, Center } from '@mantine/core'
import { GroupedProductList } from '../product/GroupedProductList'
import { ProductList } from '../product/ProductList'
import ProductListHeader from '../product/ProductListHeader'
import { useState } from 'react'
import { ErrorBoundary, getErrorMessage, type FallbackProps } from 'react-error-boundary'

const ProductListFallback = ({error, resetErrorBoundary}: FallbackProps) => {
    return (
        <Box className='flex flex-col p-2 gap-2 items-center'>
            <Center>Something went wrong: {getErrorMessage(error)}</Center>
            
            <Button onClick={resetErrorBoundary}>Retry</Button>
        </Box>
    )
}

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

    return (
        <>
            <ProductListHeader
                searchSearchTerm={searchSearchTerm}
                productStatusFilter={productStatusFilter}
                setProductStatusFilter={setProductStatusFilter}
                productsGroupBy={productsGroupBy}
                setProductsGroupBy={setProductsGroupBy}
            />

            <ErrorBoundary FallbackComponent={ProductListFallback}>
                {productsGroupBy !== '' ?
                    <GroupedProductList
                        searchedTerm={searchedTerm}
                    />
                    :
                    <ProductList
                        searchedTerm={searchedTerm}
                        productStatusFilter={productStatusFilter}
                    />
                }
            </ErrorBoundary>
        </>
    )
}

export default ProductListContainer