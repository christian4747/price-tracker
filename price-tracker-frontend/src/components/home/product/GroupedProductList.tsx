import { Accordion } from "@mantine/core"
import type { ProductType } from "../../../utils/Types"
import { useDebounce } from "@/hooks/common/useDebounce"
import { ProductListFooter } from "./ProductListFooter"
import { GroupedProduct } from "./GroupedProduct"
import ProductListSkeleton from "./ProductListSkeleton"
import { useGetProductsGrouped } from "@/hooks/product/useGetProductsGrouped"

interface GroupedProductData {
    name: string
    products: ProductType[]
}

export interface GroupedProductList {
    searchedTerm: string
}

// TODO: Add a formatter
// TODO: Look into memoizing
export const GroupedProductList = ({}: GroupedProductList) => {

    // Debounce for setting list's today's date state
    const {value: dateToday, setValueWithDebounce: setDateToday} = useDebounce(new Date())
    // Hook for getting products grouped
    const getProductsGrouped = useGetProductsGrouped()

    if (getProductsGrouped.query.isPending) {
        return (
            <ProductListSkeleton />
        )
    }

    return (
        <>
            {getProductsGrouped.query.isSuccess && (
                <div className="flex pb-5 flex-col mb-15">
                    <Accordion
                        multiple
                        variant="unstyled"
                        styles={{
                            control: { cursor: 'default' },
                            chevron: { cursor: 'pointer' },
                        }}
                        chevronIconSize={24}
                        value={getProductsGrouped.currentlyOpened}
                        onChange={getProductsGrouped.setCurrentlyOpened}
                    >
                        {getProductsGrouped.query.data.content.map((groupedProduct: GroupedProductData, idx: number) => {
                            return (
                                <Accordion.Item value={`item-${idx}`} key={groupedProduct.name}>
                                    <GroupedProduct
                                        products={groupedProduct.products}
                                        dateToday={dateToday}
                                        setDateToday={setDateToday}
                                    />
                                </Accordion.Item>
                            )
                        })}
                        <ProductListFooter
                            total={Math.ceil(getProductsGrouped.query.data.count)}
                            value={getProductsGrouped.currentPageNumber}
                            onChange={getProductsGrouped.setCurrentPageNumber}
                        />
                    </Accordion>
                </div>
            )}
        </>
    )
}