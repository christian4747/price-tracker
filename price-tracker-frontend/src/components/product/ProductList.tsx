import type { ProductBody, ProductFilterDTO } from '@/types/product'
import { useDebounce } from '@/hooks/common/useDebounce'
import { Product } from './Product'
import { useProductPage } from '@/hooks/product/useProductPage'
import { ProductListFooter } from './ProductListFooter'
import { ProductModals } from './ProductModals'
import ProductListSkeleton from './ProductListSkeleton'

export interface ProductList {
    filter: ProductFilterDTO
}

// TODO: Use productStatusFilter and searchedTerm for product list
export const ProductList = ({ filter }: ProductList) => {
    // Hook for getting products grouped
    const { changePageNumber, currentPageNumber, query } = useProductPage(undefined, undefined, filter)

    // Debounce for setting list's today's date state
    const { value: dateToday, setValueWithDebounce: setDateToday } = useDebounce(new Date())

    if (query.isLoading) return <ProductListSkeleton />
    if (!query.isSuccess) return <></>

    return (
        <>
            <div className="flex pb-5 flex-col mb-15">
                <ProductModals>
                    {/* Each row opens its own details in a modal */}
                    <div>
                        {query.data.content.map((productBody: ProductBody) => {
                            // Keyed by product, so an open product stays open when the list changes around it
                            return (
                                <Product
                                    productBody={productBody}
                                    dateToday={dateToday}
                                    setDateToday={setDateToday}
                                    key={productBody.product.productId}
                                />
                            )
                        })}
                    </div>
                </ProductModals>

                <ProductListFooter total={query.data.count} value={currentPageNumber} onChange={changePageNumber} />
            </div>
        </>
    )
}
