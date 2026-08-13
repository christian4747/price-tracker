import { type ProductType } from "@/utils/Types"
import PriceBanner from "../price/PriceBanner"
import Product from "../product/Product"
import PriceHistoryChart from "../price/PriceHistoryChart"
import PriceList from "../price/PriceList"
import { Accordion } from "@mantine/core"

type ProductProps = {
    product: ProductType
    dateToday: Date
    setDateToday: (newVal: Date) => void
}

const ProductContainer = ({product, dateToday, setDateToday}: ProductProps) => {
    return (
        <div className='h-full w-full border-t border-smoke flex flex-col gap-2 group'>
            <Accordion.Control>
                {/* Top content */}
                <div className='h-full min-h-11.25 w-full flex justify-between items-center pr-2'>
                    <Product
                        product={product}
                    />

                    <div className='flex gap-3 items-center font-bold'>
                        <PriceBanner
                            product={product}
                            dateToday={dateToday}
                            setDateToday={setDateToday}
                        />
                    </div>
                    
                </div>
            </Accordion.Control>

            <Accordion.Panel>
                {/* Lower content */}
                <div className='w-full h-full flex justify-between gap-2'>
                    <PriceHistoryChart
                        product={product}
                        dateToday={dateToday}
                    />
                    <PriceList
                        product={product}
                        setDateToday={setDateToday}
                    />
                </div>
            </Accordion.Panel>
        </div>
    )
}

export default ProductContainer