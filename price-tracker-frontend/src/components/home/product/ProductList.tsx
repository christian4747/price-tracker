import { Accordion, Center, Pagination } from "@mantine/core"
import type { ProductType } from "../../../utils/Types"
import ProductContainer from '../containers/ProductContainer'
import { useState } from "react"
import { useDebounce } from "@/hooks/common/useDebounce"
import { useGetProductPage } from "@/hooks/product/useGetProductPage"

type ProductListProps = {
    productStatusFilter: string
    searchedTerm: string
}

const ProductList = ({productStatusFilter, searchedTerm}: ProductListProps) => {

    // Debounce for setting list's today's date state
    const {value: dateToday, setValueWithDebounce: setDateToday} = useDebounce(new Date())

    // Accordion state (prevents closing when tanstack refreshes)
    const [value, setValue] = useState<string[]>([])

    // Hook for regular product list pagination
    const getProductPage = useGetProductPage()

    const changePageNumber = (pageNumber: number) => {
        getProductPage.setCurrentPageNumber(pageNumber)
        setValue([])
    }

    if (getProductPage.query.isPending) {
        return (<>Loading...</>)
    } else if (getProductPage.query.isError) {
        return (<>An error occurred: {getProductPage.query.error.message}</>)
    }

    // Product list with status filter applied
    const filterByStatus = getProductPage.query.data.filter((product: ProductType) => {
        if (productStatusFilter === 'Active') {
            return product.active
        } else if (productStatusFilter === 'Inactive') {
            return !product.active
        } else {
            return true
        }
    })

    // Product list with search term filter applied
    const filteredProducts: ProductType[] = filterByStatus.filter((product: ProductType) => {
        return product.name.toLowerCase().includes(searchedTerm.toLowerCase()) ||
            product.store.toLowerCase().includes(searchedTerm.toLowerCase())
    })

    return (
        <>
            {getProductPage.query.isSuccess && getProductPage.countQuery.isSuccess && (
                <div className="flex pb-5 flex-col mb-15">
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
                        {filteredProducts?.map((product, idx) => {
                            return (
                                <Accordion.Item value={`item-${idx}`} key={product.name + product.store}>
                                    <ProductContainer
                                        product={product}
                                        dateToday={dateToday}
                                        setDateToday={setDateToday}
                                    />
                                </Accordion.Item>
                            )
                        })}
                        <footer className="fixed bottom-5 left-0 z-50 w-full">
                            <Center>
                                <Pagination
                                    total={Math.ceil(getProductPage.countQuery.data / 10)}
                                    value={getProductPage.currentPageNumber}
                                    onChange={changePageNumber}
                                />
                            </Center>
                        </footer>
                    </Accordion>
                </div>
            )}
        </>
    )
}

export default ProductList