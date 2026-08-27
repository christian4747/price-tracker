import { Accordion } from "@mantine/core"
import type { ProductType } from "../../../utils/Types"
import { useDebounce } from "@/hooks/common/useDebounce"
import { ProductListFooter } from "./ProductListFooter"
import { useGetProductPage } from "@/hooks/product/useGetProductPage"
import { Product } from "./Product"
import ProductListSkeleton from "./ProductListSkeleton"

export interface ProductList {
    productStatusFilter: string
    searchedTerm: string
}

// TODO: Use productStatusFilter and searchedTerm for product list
export const ProductList = ({}: ProductList) => {

    // Debounce for setting list's today's date state
    const {value: dateToday, setValueWithDebounce: setDateToday} = useDebounce(new Date())
    // Hook for regular product list pagination
    const getProductPage = useGetProductPage()

    if (getProductPage.query.isPending) {
        return (
            <ProductListSkeleton />
        )
    }

    return (
        <>
            {getProductPage.query.isSuccess && (
                <div className="flex pb-5 flex-col mb-15">
                    <Accordion
                        multiple
                        variant="unstyled"
                        styles={{
                            control: { cursor: 'default' },
                            chevron: { cursor: 'pointer' },
                        }}
                        chevronIconSize={24}
                        value={getProductPage.currentlyOpened}
                        onChange={getProductPage.setCurrentlyOpened}
                    >
                        {getProductPage.query.data.content.map((product: ProductType, idx: number) => {
                            return (
                                <Accordion.Item value={`item-${idx}`} key={product.name + product.store}>
                                    <Product
                                        product={product}
                                        dateToday={dateToday}
                                        setDateToday={setDateToday}
                                    />
                                </Accordion.Item>
                            )
                        })}
                        <ProductListFooter
                            total={getProductPage.query.data.count}
                            value={getProductPage.currentPageNumber}
                            onChange={getProductPage.changePageNumber}
                        />
                    </Accordion>
                </div>
            )}
        </>
    )
}