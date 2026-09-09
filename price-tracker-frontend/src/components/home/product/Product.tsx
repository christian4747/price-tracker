import { type ProductType } from "@/utils/Types"
import { Accordion } from "@mantine/core"
import { ProductTitleBar } from "./ProductTitleBar"
import { ProductDetails } from "./ProductDetails"

export interface Product {
    dateToday: Date
    product: ProductType
    setDateToday: (newVal: Date) => void
    value: string
}

export const Product = ({ product, dateToday, setDateToday, value }: Product) => {
    return (
        <Accordion.Item value={value}>
            <div className='h-full w-full border-b border-smoke flex flex-col group'>
                <Accordion.Control>
                    {/* Top content */}
                    <ProductTitleBar
                        product={product}
                        dateToday={dateToday}
                        setDateToday={setDateToday}
                    />
                </Accordion.Control>

                <Accordion.Panel>
                    {/* Lower content */}
                    <ProductDetails
                        dateToday={dateToday}
                        product={product}
                        setDateToday={setDateToday}
                    />
                </Accordion.Panel>
            </div>
        </Accordion.Item>
    )
}