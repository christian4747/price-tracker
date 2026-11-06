import type { ProductBody } from '@/types/product'
import { Accordion } from '@mantine/core'
import { ProductTitleBar } from './ProductTitleBar'
import { ProductDetails } from './ProductDetails'
import { ProductRowControl } from './ProductRowControl'

export interface Product {
    dateToday: Date
    productBody: ProductBody
    setDateToday: (newVal: Date) => void
    value: string
}

export const Product = ({ productBody, dateToday, setDateToday, value }: Product) => {
    return (
        <Accordion.Item value={value}>
            <div className="h-full w-full border-b border-smoke flex flex-col">
                <ProductRowControl product={productBody.product}>
                    {/* Top content */}
                    <ProductTitleBar productBody={productBody} dateToday={dateToday} setDateToday={setDateToday} />
                </ProductRowControl>

                <Accordion.Panel>
                    {/* Lower content */}
                    <ProductDetails dateToday={dateToday} productBody={productBody} setDateToday={setDateToday} />
                </Accordion.Panel>
            </div>
        </Accordion.Item>
    )
}
