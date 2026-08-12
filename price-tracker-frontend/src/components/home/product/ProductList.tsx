import { Accordion } from "@mantine/core"
import type { ProductType } from "../../../utils/Types"
import ProductContainer from '../containers/ProductPriceListContainer'
import { useState } from "react"
import { useDebounce } from "@/hooks/common/useDebounce"

type ProductListProps = {
    products: ProductType[]
}

const ProductList = ({products}: ProductListProps) => {

    // Debounce for setting list's today's date state
    const {value: dateToday, setValueWithDebounce: setDateToday} = useDebounce(new Date())

    // Accordion state (prevents closing when tanstack refreshes)
    const [value, setValue] = useState<string[]>([]);

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
                </Accordion>
            </div>
        </>
    )
}

export default ProductList