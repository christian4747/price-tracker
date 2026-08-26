import { Accordion } from "@mantine/core"
import type { ProductType } from "../../../utils/Types"
import { useDebounce } from "@/hooks/common/useDebounce"
import { ProductListFooter } from "./ProductListFooter"
import { GroupedProduct } from "./GroupedProduct"
import { useGetProductsGrouped } from "@/hooks/product/useGetProductsGrouped"

interface GroupedProductData {
    name: string
    products: ProductType[]
}

export interface GroupedProductList {
    searchedTerm: string
}

export const GroupedProductList = ({}: GroupedProductList) => {

    // Debounce for setting list's today's date state
    const {value: dateToday, setValueWithDebounce: setDateToday} = useDebounce(new Date())
    // Hook for getting products grouped
    const getProductsGrouped = useGetProductsGrouped()

    if (getProductsGrouped.query.isPending) {
        return (<>Loading...</>)
    } else if (getProductsGrouped.query.isError) {
        return (<>An error occurred: {getProductsGrouped.query.error.message}</>)
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
                        {getProductsGrouped.query.data?.productNameGroupDTOs.map((groupedProduct: GroupedProductData, idx: number) => {
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