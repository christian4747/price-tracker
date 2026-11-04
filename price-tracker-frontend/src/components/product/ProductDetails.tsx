import type { ProductBody } from '@/types/product'
import PriceHistoryChart from '@/components/price/PriceHistoryChart'
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
                <div className="w-full flex-1 flex justify-between gap-2">
                    <Skeleton className="mt-1 max-w-7/10" height={245} />
                    <div className="w-3/10">
                        <Skeleton className="mt-1" height={245} />
                    </div>
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
                <div className="flex flex-col w-3/10 gap-2">
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
