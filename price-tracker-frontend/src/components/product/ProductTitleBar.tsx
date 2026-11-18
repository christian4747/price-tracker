import type { ProductBody } from '@/types/product'
import { PriceBanner } from '@/components/price/PriceBanner'
import { ProductTitleDetails } from './ProductTitleDetails'

export interface ProductTitleBar {
    productBody: ProductBody
    otherStoresText?: string
    dateToday: Date
    setDateToday: (newVal: Date) => void
    // Show the whole title, and let the banner and price wrap onto a line of their own, right-aligned, when they don't
    // fit beside it, as in the details' header
    wrap?: boolean
}

// A product's name, store, and brand, with its price banner, discount, and price beside them
export const ProductTitleBar = ({
    productBody,
    otherStoresText,
    dateToday,
    setDateToday,
    wrap = false
}: ProductTitleBar) => {
    return (
        <div
            className={`h-full min-h-11.25 w-full flex justify-between items-center pr-2 ${wrap ? 'flex-wrap gap-y-1' : ''}`}
        >
            <ProductTitleDetails product={productBody.product} otherStoresText={otherStoresText} wrap={wrap} />

            {/* On a phone even a line of its own can be too narrow for the indicators, banner, discount, and price, so
                they wrap again, still right-aligned */}
            <div className={`flex gap-3 items-center font-bold ${wrap ? 'ml-auto flex-wrap justify-end gap-y-1' : ''}`}>
                <PriceBanner productBody={productBody} dateToday={dateToday} setDateToday={setDateToday} />
            </div>
        </div>
    )
}
