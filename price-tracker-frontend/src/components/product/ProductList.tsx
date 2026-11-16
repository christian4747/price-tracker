import { Accordion } from '@mantine/core'
import type { ProductBody, ProductFilterDTO } from '@/types/product'
import { useDebounce } from '@/hooks/common/useDebounce'
import { Product } from './Product'
import { useProductPage } from '@/hooks/product/useProductPage'
import { ProductListFooter } from './ProductListFooter'
import { ProductModals } from './ProductModals'
import ProductListSkeleton from './ProductListSkeleton'
import { productAccordionStyles } from './productAccordionStyles'

export interface ProductList {
    filter: ProductFilterDTO
}

// TODO: Use productStatusFilter and searchedTerm for product list
export const ProductList = ({ filter }: ProductList) => {
    // Hook for getting products grouped
    const { changePageNumber, currentlyOpened, currentPageNumber, query, setCurrentlyOpened } = useProductPage(
        undefined,
        undefined,
        filter
    )

    // Debounce for setting list's today's date state
    const { value: dateToday, setValueWithDebounce: setDateToday } = useDebounce(new Date())

    if (query.isLoading) return <ProductListSkeleton />
    if (!query.isSuccess) return <></>

    return (
        <>
            <div className="flex pb-5 flex-col mb-15">
                <ProductModals>
                    <Accordion
                        multiple
                        variant="unstyled"
                        styles={productAccordionStyles}
                        chevronIconSize={24}
                        value={currentlyOpened}
                        onChange={setCurrentlyOpened}
                        transitionDuration={400}
                    >
                        {query.data.content.map((productBody: ProductBody) => {
                            // Key open state by product so it follows the product when the list changes
                            return (
                                <Product
                                    productBody={productBody}
                                    dateToday={dateToday}
                                    setDateToday={setDateToday}
                                    value={`product-${productBody.product.productId}`}
                                    key={productBody.product.productId}
                                />
                            )
                        })}
                    </Accordion>
                </ProductModals>

                <ProductListFooter total={query.data.count} value={currentPageNumber} onChange={changePageNumber} />
            </div>
        </>
    )
}
