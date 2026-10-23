import type { ProductType } from '@/types/product'
import PriceHistoryChart from '@/components/price/PriceHistoryChart'
import { PriceList } from '@/components/price/PriceList'
import { usePricePage } from '@/hooks/price/usePricePage'
import { Skeleton } from '@mantine/core'
import { useState } from 'react'

export interface ProductDetails {
    dateToday: Date
    product: ProductType
    setDateToday: (newVal: Date) => void
    children?: React.ReactNode
}

export const ProductDetails = ({ product, dateToday, setDateToday, children }: ProductDetails) => {
    const [showDeleted, setShowDeleted] = useState(false)
    const { query: pricesQuery } = usePricePage(product.productId, showDeleted)

    if (pricesQuery.isLoading) {
        return (
            <div className="w-full h-full flex justify-between gap-2">
                <Skeleton className="mt-1 max-w-7/10" height={245} />
                <div className="w-3/10">
                    <Skeleton className="mt-1" height={245} />
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full flex justify-between gap-2">
            <PriceHistoryChart prices={pricesQuery.data} dateToday={dateToday} />
            <div className="flex flex-col w-3/10 gap-2">
                {children}
                <PriceList
                    product={product}
                    prices={pricesQuery.data}
                    setDateToday={setDateToday}
                    showDeleted={showDeleted}
                    setShowDeleted={setShowDeleted}
                />
            </div>
        </div>
    )
}
