import type { ProductBody } from '@/types/product'
import PriceHistoryChart, { PRICE_CHART_BOX_CLASS, PRICE_CHART_HEIGHT } from '@/components/price/PriceHistoryChart'
import { PriceList } from '@/components/price/PriceList'
import { usePricePage } from '@/hooks/price/usePricePage'
import { Button, Skeleton } from '@mantine/core'
import { useState } from 'react'
import { AddedUpdatedText } from '@/components/common/AddedUpdatedText'

export interface ProductDetails {
    dateToday: Date
    productBody: ProductBody
    setDateToday: (newVal: Date) => void
    children?: React.ReactNode
}

export const ProductDetails = ({ productBody, dateToday, setDateToday, children }: ProductDetails) => {
    const { product } = productBody
    const [showDeleted, setShowDeleted] = useState(false)
    const { query: pricesQuery } = usePricePage(product.productId, showDeleted)

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
                {/* Sized like the chart's box (the skeleton covers the spacer inside it), and the price list side
                    stretches to match, so the panel doesn't change height when the prices arrive */}
                <div className="w-full flex-1 flex justify-between gap-2">
                    <Skeleton className={`${PRICE_CHART_BOX_CLASS} border-transparent`}>
                        <div style={{ height: PRICE_CHART_HEIGHT }} />
                    </Skeleton>
                    <Skeleton className="w-3/10" />
                </div>
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
            <div className="w-full flex-1 flex justify-between gap-2">
                <PriceHistoryChart prices={pricesQuery.data} dateToday={dateToday} />
                {/* contain-size stops this column's contents from setting its height, so the chart alone sets the
                    panel's height and every product's panel matches; the price list scrolls in the room left */}
                <div className="flex flex-col w-3/10 gap-2 contain-size">
                    {children}
                    <PriceList
                        productBody={productBody}
                        prices={pricesQuery.data}
                        setDateToday={setDateToday}
                        showDeleted={showDeleted}
                        setShowDeleted={setShowDeleted}
                    />
                </div>
            </div>
            {productDates}
        </div>
    )
}
