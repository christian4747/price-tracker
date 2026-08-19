import { Accordion, Center, Pagination } from "@mantine/core"
import type { ProductType } from "../../../utils/Types"
import { useState } from "react"
import { useDebounce } from "@/hooks/common/useDebounce"
import GroupedProduct from "./GroupedProduct"
import { useGetProductsGrouped } from "@/hooks/product/useGetProductsGrouped"

type GroupedProduct = {
    name: string
    products: ProductType[]
}

type GroupedProductListProps = {
    searchedTerm: string
}

const GroupedProductList = ({searchedTerm}: GroupedProductListProps) => {

    // Debounce for setting list's today's date state
    const {value: dateToday, setValueWithDebounce: setDateToday} = useDebounce(new Date())

    // Accordion state (prevents closing when tanstack refreshes)
    const [value, setValue] = useState<string[]>([])

    // Hook for getting products grouped
    const getProductsGrouped = useGetProductsGrouped()

    if (getProductsGrouped.query.isPending) {
        return (
            <>
                Loading...
            </>
        )
    } else if (getProductsGrouped.query.isError) {
        return (
            <>
                An error occurred: {getProductsGrouped.query.error.message}
            </>
        )
    }

    console.log(getProductsGrouped.query.data)

    // Product list with search term filter applied
    const filteredProducts: GroupedProduct[] = getProductsGrouped.query.data?.productNameGroupDTOs.filter((productNameGroupDTO: GroupedProduct) => {
        return productNameGroupDTO.name.toLowerCase().includes(searchedTerm.toLowerCase())
    })

    return (
        <>
            {getProductsGrouped.query.isSuccess && getProductsGrouped.countQuery.isSuccess && (
                <div className="flex pb-5 flex-col border-smoke">
                    <Accordion
                        multiple
                        variant="unstyled"
                        styles={{
                            control: { cursor: 'default' },
                            chevron: { cursor: 'pointer' },
                        }}
                        chevronIconSize={24}
                        value={value}
                        onChange={setValue}
                    >
                        {filteredProducts?.map((groupedProduct, idx) => {
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
                        <Center>
                            <Pagination
                                total={Math.ceil(getProductsGrouped.query.data?.count / 10)}
                                value={getProductsGrouped.currentPageNumber}
                                onChange={getProductsGrouped.setCurrentPageNumber}
                            />
                        </Center>
                    </Accordion>
                </div>
            )}
        </>
    )
}

export default GroupedProductList