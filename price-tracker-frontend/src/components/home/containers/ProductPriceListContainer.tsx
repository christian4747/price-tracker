import { type ProductType } from "@/utils/Types"
import PriceBanner from "../price/PriceBanner"
import Product from "../product/Product"
import PriceHistoryChart from "../price/PriceHistoryChart"
import PriceList from "../price/PriceList"
import { useToggleVisibility } from "@/hooks/common/useToggleVisibility"
import { usePriceData } from "@/hooks/price/usePriceData"
import { Accordion } from "@mantine/core"

type ProductProps = {
    product: ProductType
}

const ProductContainer = ({product}: ProductProps) => {

    // State for Product visibility
    const hideProduct = useToggleVisibility(false)

    // Hook for price data
    const priceData = usePriceData(product)

    if (hideProduct.value === true) return (<></>)

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
                            discountPercent={priceData.getMostRecentDiscount()}
                            bannerType={priceData.getBannerType()}
                            price={priceData.getMostRecentPrice()}
                        />
                    </div>
                    
                </div>
            </Accordion.Control>

            <Accordion.Panel>
                {/* Lower content */}
                <div className='w-full h-full flex justify-between gap-2'>
                    <PriceHistoryChart priceData={priceData.chartPriceData} />
                    <PriceList
                        sortedPrices={priceData.sortedPricesByDate}
                        product={product}
                    />
                </div>
            </Accordion.Panel>

        </div>
    )
}

export default ProductContainer