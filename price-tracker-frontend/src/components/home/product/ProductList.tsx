import { Accordion, Center, Pagination } from "@mantine/core"
import type { ProductType } from "../../../utils/Types"
import ProductContainer from '../containers/ProductContainer'
import { useState } from "react"
import { useDebounce } from "@/hooks/common/useDebounce"

type ProductListProps = {
    productCount: number
    products: ProductType[]
    currentPageNumber: number
    setCurrentPageNumber: (pageNumber: number) => void
}

const ProductList = ({productCount, products, currentPageNumber, setCurrentPageNumber}: ProductListProps) => {

    // Debounce for setting list's today's date state
    const {value: dateToday, setValueWithDebounce: setDateToday} = useDebounce(new Date())

    // Accordion state (prevents closing when tanstack refreshes)
    const [value, setValue] = useState<string[]>([])

    return (
        <>
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
                    {products?.map((product, idx) => {
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
                    <Center>
                        <Pagination total={Math.ceil(productCount / 10)} value={currentPageNumber} onChange={setCurrentPageNumber} />
                    </Center>
                </Accordion>
            </div>
        </>
    )
}

export default ProductList