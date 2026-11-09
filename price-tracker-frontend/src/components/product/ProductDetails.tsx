import type { ProductBody } from '@/types/product'
import PriceHistoryChart, { PRICE_CHART_BOX_CLASS, PRICE_CHART_HEIGHT } from '@/components/price/PriceHistoryChart'
import { PriceList } from '@/components/price/PriceList'
import { useProductPrices } from '@/hooks/price/useProductPrices'
import { Button, Skeleton } from '@mantine/core'
import { useState } from 'react'
import { AddedUpdatedText } from '@/components/common/AddedUpdatedText'
import { ResizableSplit } from '@/components/common/ResizableSplit'
import type { PriceTimeRange } from '@/types/price'
import { DEFAULT_PRICE_TIME_RANGE, getPriceTimeRangeStart } from '@/utils/priceTimeRange'

// Every product's panel shares one remembered split between the chart and the price list
const DETAILS_SPLIT_STORAGE_KEY = 'product-details-split'
const DETAILS_SPLIT_DEFAULT_SHARE = 0.7
// Room for the time range control and the dates under the chart
const PRICE_CHART_MIN_WIDTH = 360
// Room for the Add Price and Quick Price buttons side by side
const PRICE_LIST_MIN_WIDTH = 240

export interface ProductDetails {
    dateToday: Date
    productBody: ProductBody
    setDateToday: (newVal: Date) => void
    children?: React.ReactNode
}

export const ProductDetails = ({ productBody, dateToday, setDateToday, children }: ProductDetails) => {
    const { product } = productBody
    const [showDeleted, setShowDeleted] = useState(false)
    // Each product keeps its own time range until the page reloads
    const [timeRange, setTimeRange] = useState<PriceTimeRange>(DEFAULT_PRICE_TIME_RANGE)
    const { query: pricesQuery } = useProductPrices(
        product.productId,
        showDeleted,
        getPriceTimeRangeStart(timeRange, dateToday)
    )

    // Shown on their own line under the chart and price list, inside the panel, so they open and close with the
    // rest of the details without changing the height of the chart or price list
    const productDates = (
        <AddedUpdatedText
            createdAt={product.createdAt}
            updatedAt={product.updatedAt}
            className="block pt-2 text-right"
        />
    )

    if (pricesQuery.isPending) {
        return (
            <div className="w-full h-full flex flex-col">
                {/* Sized like the box around the chart and price list (the skeleton covers the spacer inside it), so
                    the panel doesn't change height when the prices arrive */}
                <Skeleton className={`${PRICE_CHART_BOX_CLASS} w-full flex-1 border border-transparent`}>
                    <div style={{ height: PRICE_CHART_HEIGHT }} />
                </Skeleton>
                {productDates}
            </div>
        )
    }

    // Retrying here refetches only this product's prices, without reloading the page
    if (pricesQuery.isError) {
        return (
            <div className="w-full h-full flex flex-col">
                <div className="w-full flex-1 flex flex-col items-center justify-center gap-2 py-6">
                    <span className="text-sm text-raincloud">Couldn't load prices</span>
                    <Button size="xs" onClick={() => pricesQuery.refetch()} loading={pricesQuery.isFetching}>
                        Retry
                    </Button>
                </div>
                {productDates}
            </div>
        )
    }

    return (
        <div className="w-full h-full flex flex-col">
            {/* One box around the chart and price list. The border sits outside the split, which measures its own
                width with any border included. */}
            <div className="w-full flex-1 border border-smoke rounded-sm overflow-hidden">
                <ResizableSplit
                    className="h-full"
                    separatorLabel="Resize chart and price list"
                    defaultShare={DETAILS_SPLIT_DEFAULT_SHARE}
                    minStartWidth={PRICE_CHART_MIN_WIDTH}
                    minEndWidth={PRICE_LIST_MIN_WIDTH}
                    storageKey={DETAILS_SPLIT_STORAGE_KEY}
                    start={
                        <PriceHistoryChart
                            prices={pricesQuery.data}
                            dateToday={dateToday}
                            timeRange={timeRange}
                            setTimeRange={setTimeRange}
                        />
                    }
                    // contain-size stops the list's contents from setting its height, so the chart alone sets the
                    // panel's height and every product's panel matches; the price list scrolls in the room left
                    endClassName="flex flex-col gap-2 contain-size"
                    end={
                        <>
                            {children}
                            <PriceList
                                productBody={productBody}
                                prices={pricesQuery.data}
                                setDateToday={setDateToday}
                                showDeleted={showDeleted}
                                setShowDeleted={setShowDeleted}
                            />
                        </>
                    }
                />
            </div>
            {productDates}
        </div>
    )
}
