import { type ProductType } from "@/utils/Types"
import PriceHistoryChart from "../price/PriceHistoryChart"
import { PriceList } from "../price/PriceList"
import { usePricePage } from "@/hooks/price/usePricePage"
import { Skeleton } from "@mantine/core"

export interface ProductDetails {
    dateToday: Date
    product: ProductType
    setDateToday: (newVal: Date) => void
}

export const ProductDetails = ({ product, dateToday, setDateToday }: ProductDetails) => {

    const { query: pricesQuery } = usePricePage(product.productId)

    if (pricesQuery.isLoading) {
        return (
            <div className='w-full h-full flex justify-between gap-2' >
                <Skeleton className="mt-1 max-w-7/10" height={245} />
                <div className="w-3/10">
                    <Skeleton className="mt-1" height={245} />
                </div>
            </div>
        )
    }

    return (
        <div className = 'w-full h-full flex justify-between gap-2' >
            <PriceHistoryChart
                prices={pricesQuery.data}
                dateToday={dateToday}
            />
            <div className="w-3/10">
                <PriceList
                    product={product}
                    prices={pricesQuery.data}
                    setDateToday={setDateToday}
                />
            </div>
        </div>
    )
}