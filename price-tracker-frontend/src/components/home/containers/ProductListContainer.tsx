import { Box, Button, Center } from '@mantine/core'
import { GroupedProductList } from '../product/GroupedProductList'
import { ProductList } from '../product/ProductList'
import { ProductListHeader } from '../product/ProductListHeader'
import { useState } from 'react'
import { ErrorBoundary, getErrorMessage, type FallbackProps } from 'react-error-boundary'
import { useProductFilterDTO } from '@/hooks/product/useProductFilterDTO'

const ProductListFallback = ({error, resetErrorBoundary}: FallbackProps) => {
    return (
        <Box className='flex flex-col p-2 gap-2 items-center'>
            <Center>Something went wrong: {getErrorMessage(error)}</Center>
            
            <Button onClick={resetErrorBoundary}>Retry</Button>
        </Box>
    )
}

export const ProductListContainer = () => {

    // Hook for using ProductFilterDTO
    const { value: productFilterDTO, setSearchTerm, setField } = useProductFilterDTO()

    // State for tracking group by
    const [productsGroupBy, setProductsGroupBy] = useState('')

    // Sets the search term, triggering a filter and refresh
    const searchSearchTerm = (searchTerm: string) => {
        setSearchTerm(searchTerm)
    }

    return (
        <>
            <ProductListHeader
                searchSearchTerm={searchSearchTerm}
                productsGroupBy={productsGroupBy}
                setProductsGroupBy={setProductsGroupBy}
                productFilterDTO={productFilterDTO}
                setField={setField}
            />

            <ErrorBoundary FallbackComponent={ProductListFallback}>
                {productsGroupBy !== '' ?
                    <GroupedProductList
                        searchedTerm={productFilterDTO.name}
                        showDeleted={productFilterDTO.deleted === 'true' ? 'Show' : 'Hide'}
                    />
                    :
                    <ProductList
                        searchedTerm={productFilterDTO.name}
                        productStatusFilter={productFilterDTO.active}
                        showDeleted={productFilterDTO.deleted === 'true' ? 'Show' : 'Hide'}
                    />
                }
            </ErrorBoundary>
        </>
    )
}