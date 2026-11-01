import { Accordion } from '@mantine/core'
import type { ProductBody, ProductFilterDTO } from '@/types/product'
import { useDebounce } from '@/hooks/common/useDebounce'
import { ProductListFooter } from './ProductListFooter'
import { useProductPageGrouped } from '@/hooks/product/useProductPageGrouped'
import { ProductModals } from './ProductModals'
import ProductListSkeleton from './ProductListSkeleton'
import { GroupedProduct } from './GroupedProduct'

interface GroupedProductData {
    name: string
    products: ProductBody[]
}

export interface GroupedProductList {
    filter: ProductFilterDTO
}

// TODO: Add a formatter
// TODO: Look into memoizing
export const GroupedProductList = ({ filter }: GroupedProductList) => {
    // Hook for getting products grouped
    const { changePageNumber, currentlyOpened, currentPageNumber, query, setCurrentlyOpened } = useProductPageGrouped(
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
                        styles={{
                            control: { cursor: 'default' },
                            chevron: { cursor: 'pointer' }
                        }}
                        chevronIconSize={24}
                        value={currentlyOpened}
                        onChange={setCurrentlyOpened}
                        transitionDuration={400}
                    >
                        {query.data.content.map((groupedProduct: GroupedProductData) => {
                            // Key open state by group name so it follows the group when the list changes
                            return (
                                <Accordion.Item value={`group-${groupedProduct.name}`} key={groupedProduct.name}>
                                    <GroupedProduct
                                        productBodies={groupedProduct.products}
                                        dateToday={dateToday}
                                        setDateToday={setDateToday}
                                    />
                                </Accordion.Item>
                            )
                        })}
                    </Accordion>
                </ProductModals>

                <ProductListFooter total={query.data.count} value={currentPageNumber} onChange={changePageNumber} />
            </div>
        </>
    )
}
