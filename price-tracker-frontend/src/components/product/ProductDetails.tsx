import type { ProductBody } from '@/types/product'
import PriceHistoryChart, { PRICE_CHART_BOX_CLASS, PRICE_CHART_HEIGHT } from '@/components/price/PriceHistoryChart'
import { PriceList } from '@/components/price/PriceList'
import { useProductPrices } from '@/hooks/price/useProductPrices'
import { Button, Skeleton } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useState } from 'react'
import { AddedUpdatedText } from '@/components/common/AddedUpdatedText'
import { ResizableSplit } from '@/components/common/ResizableSplit'
import type { PriceTimeRange } from '@/types/price'
import { DEFAULT_PRICE_TIME_RANGE, getPriceTimeRangeStart } from '@/utils/priceTimeRange'
import { PHONE_MEDIA_QUERY } from '@/utils/mediaQueries'

// Every product's panel shares one remembered split between the chart and the price list
const DETAILS_SPLIT_STORAGE_KEY = 'product-details-split'
const DETAILS_SPLIT_DEFAULT_SHARE = 0.7
// Room for the time range control and the dates under the chart
const PRICE_CHART_MIN_WIDTH = 360
// Room for the Add Price and Quick Price buttons side by side, and for whole dates, at the desktop font size (the
// larger one). 300 px is the least that fits; the rest leaves room for fonts that render a little wider.
const PRICE_LIST_MIN_WIDTH = 320
// The price list's height on a phone, under the chart, where nothing beside it sets its height. Room for about six
// prices and the footer, with the list scrolling for more.
const STACKED_PRICE_LIST_CLASS = 'h-96'

export interface ProductDetails {
    dateToday: Date
    productBody: ProductBody
    setDateToday: (newVal: Date) => void
    children?: React.ReactNode
}

// A product's price chart and price list, with when the product was added and last updated under them. Side by side
// with a divider to resize them, or on a phone one above the other.
export const ProductDetails = ({ productBody, dateToday, setDateToday, children }: ProductDetails) => {
    const { product } = productBody
    // Read on the first render rather than after it, so the layout doesn't change once the details are showing
    const stacked = useMediaQuery(PHONE_MEDIA_QUERY, undefined, { getInitialValueInEffect: false })
    const [showDeleted, setShowDeleted] = useState(false)
    // Each product keeps its own time range until the page reloads
    const [timeRange, setTimeRange] = useState<PriceTimeRange>(DEFAULT_PRICE_TIME_RANGE)
    const { query: pricesQuery } = useProductPrices(
        product.productId,
        showDeleted,
        getPriceTimeRangeStart(timeRange, dateToday)
    )

    // Shown on their own line under the chart and price list, without changing the height of either. The space above
    // matches the space under the details' window (ProductDetailsModal), so the dates sit centered in their row.
    const productDates = (
        <AddedUpdatedText
            createdAt={product.createdAt}
            updatedAt={product.updatedAt}
            className="block pt-3 text-right"
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

    const chart = (
        <PriceHistoryChart
            prices={pricesQuery.data}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            averagePrice={productBody.averagePrice}
            // The currency the price list shows the average in
            currency={productBody.priceToday?.currency || 'USD'}
        />
    )

    const priceList = (
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
    )

    return (
        <div className="w-full h-full flex flex-col">
            {/* One box around the chart and price list. The border sits outside the split, which measures its own
                width with any border included. */}
            <div className="w-full flex-1 border border-smoke rounded-sm overflow-hidden">
                {stacked ? (
                    // A phone is too narrow for the chart and price list side by side (their minimum widths), and
                    // dragging a divider up and down would fight with scrolling the page, so there's no divider. The
                    // line above the list matches the divider's. The list scrolls in its fixed height rather than
                    // growing with its prices.
                    <>
                        {chart}
                        <div className={`flex flex-col gap-2 border-t border-smoke ${STACKED_PRICE_LIST_CLASS}`}>
                            {priceList}
                        </div>
                    </>
                ) : (
                    <ResizableSplit
                        className="h-full"
                        separatorLabel="Resize chart and price list"
                        defaultShare={DETAILS_SPLIT_DEFAULT_SHARE}
                        minStartWidth={PRICE_CHART_MIN_WIDTH}
                        minEndWidth={PRICE_LIST_MIN_WIDTH}
                        storageKey={DETAILS_SPLIT_STORAGE_KEY}
                        start={chart}
                        // contain-size stops the list's contents from setting its height, so the chart alone sets the
                        // panel's height and every product's panel matches; the price list scrolls in the room left
                        endClassName="flex flex-col gap-2 contain-size"
                        end={priceList}
                    />
                )}
            </div>
            {productDates}
        </div>
    )
}
