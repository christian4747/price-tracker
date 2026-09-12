import { type ProductBody } from "@/utils/Types"
import { Accordion } from "@mantine/core"
import { ProductTitleBar } from "./ProductTitleBar"
import { ProductDetails } from "./ProductDetails"

export interface Product {
    dateToday: Date
    productBody: ProductBody
    setDateToday: (newVal: Date) => void
    value: string
}

export const Product = ({ productBody, dateToday, setDateToday, value }: Product) => {
    return (
        <Accordion.Item value={value}>
            <div className='h-full w-full border-b border-smoke flex flex-col group'>
                <Accordion.Control>
                    {/* Top content */}
                    <ProductTitleBar
                        productBody={productBody}
                        dateToday={dateToday}
                        setDateToday={setDateToday}
                    />
                </Accordion.Control>

                <Accordion.Panel>
                    {/* Lower content */}
                    <ProductDetails
                        dateToday={dateToday}
                        product={productBody.product}
                        setDateToday={setDateToday}
                    />
                </Accordion.Panel>
            </div>
        </Accordion.Item>
    )
}