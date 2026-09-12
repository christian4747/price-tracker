import { type ProductBody } from "@/utils/Types"
import { Skeleton } from "@mantine/core"
import { usePricePage } from "@/hooks/price/usePricePage"
import PriceHistoryChart from "../price/PriceHistoryChart"
import { PriceList } from "../price/PriceList"

export interface GroupedProductDescription {
    productBody: ProductBody
    dateToday: Date
    setDateToday: (newVal: Date) => void
    children: React.ReactNode
}

export const GroupedProductDescription = ({ productBody, dateToday, setDateToday, children }: GroupedProductDescription) => {

    const { query: pricesQuery } = usePricePage(productBody.product.productId)

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
        <div className='w-full h-full flex justify-between gap-2'>
            <PriceHistoryChart
                prices={pricesQuery.data}
                dateToday={dateToday}
            />
            <div className="flex flex-col w-3/10 gap-2">
                {children}
                <PriceList
                    product={productBody.product}
                    setDateToday={setDateToday}
                    prices={pricesQuery.data}
                />
            </div>
        </div>
    )
}