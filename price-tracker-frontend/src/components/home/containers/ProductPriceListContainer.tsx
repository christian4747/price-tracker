import { type ProductType } from "@/utils/Types"
import PriceBanner from "../price/PriceBanner"
import Product from "../product/Product"
import PriceHistoryChart from "../price/PriceHistoryChart"
import PriceList from "../price/PriceList"
import { Accordion } from "@mantine/core"

type ProductProps = {
    product: ProductType
}

const ProductContainer = ({product}: ProductProps) => {
    return (
        <div className='h-full w-full border-t border-smoke flex flex-col gap-2 group'>
            <Accordion.Control>
                {/* Top content */}
                <div className='h-full w-full flex justify-between items-center pr-2'>
                    <Product
                        product={product}
                    />

                    <div className='flex gap-3 items-center font-bold'>
                        <PriceBanner
                            product={product}
                        />
                    </div>
                    
                </div>
            </Accordion.Control>

            <Accordion.Panel>
                {/* Lower content */}
                <div className='w-full h-full flex justify-between gap-2'>
                    <PriceHistoryChart product={product} />
                    <PriceList product={product}/>
                </div>
            </Accordion.Panel>

        </div>
    )
}

export default ProductContainer