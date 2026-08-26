import { type ProductType } from "@/utils/Types"
import PriceHistoryChart from "../price/PriceHistoryChart"
import PriceList from "../price/PriceList"
import { Accordion } from "@mantine/core"
import { ProductTitleBar } from "./ProductTitleBar"

export interface Product {
    dateToday: Date
    product: ProductType
    setDateToday: (newVal: Date) => void
}

export const Product = ({ product, dateToday, setDateToday }: Product) => {
    return (
        <div className='h-full w-full border-b border-smoke flex flex-col gap-2 group'>
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
                <div className='w-full h-full flex justify-between gap-2'>
                    <PriceHistoryChart
                        product={product}
                        dateToday={dateToday}
                    />
                    <div className="w-3/10">
                        <PriceList
                            product={product}
                            setDateToday={setDateToday}
                        />
                    </div>
                </div>
            </Accordion.Panel>
        </div>
    )
}