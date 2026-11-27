import type { ProductFilterDTO, ProductNameGroup } from '@/types/product'
import { useDebounce } from '@/hooks/common/useDebounce'
import { ProductListFooter } from './ProductListFooter'
import { useProductPageGrouped } from '@/hooks/product/useProductPageGrouped'
import { ProductModals } from './ProductModals'
import ProductListSkeleton from './ProductListSkeleton'
import { GroupedProduct } from './GroupedProduct'

export interface GroupedProductList {
    filter: ProductFilterDTO
}

// TODO: Add a formatter
// TODO: Look into memoizing
export const GroupedProductList = ({ filter }: GroupedProductList) => {
    // Hook for getting products grouped
    const { changePageNumber, currentPageNumber, query } = useProductPageGrouped(undefined, undefined, filter)

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
                        {query.data.content.map((groupedProduct: ProductNameGroup) => {
                            // Keyed by group name, so an open group stays open when the list changes around it
                            return (
                                <GroupedProduct
                                    key={groupedProduct.name}
                                    productBodies={groupedProduct.products}
                                    dateToday={dateToday}
                                    setDateToday={setDateToday}
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
