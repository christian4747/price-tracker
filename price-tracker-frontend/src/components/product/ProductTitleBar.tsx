import type { ProductBody } from '@/types/product'
import { PriceBanner } from '@/components/price/PriceBanner'
import { ProductTitleDetails } from './ProductTitleDetails'

export interface ProductTitleBar {
    productBody: ProductBody
    otherStoresText?: string
    dateToday: Date
    setDateToday: (newVal: Date) => void
}

export const ProductTitleBar = ({ productBody, otherStoresText, dateToday, setDateToday }: ProductTitleBar) => {
    return (
        <div className="h-full min-h-11.25 w-full flex justify-between items-center pr-2">
            <ProductTitleDetails product={productBody.product} otherStoresText={otherStoresText} />

            <div className="flex gap-3 items-center font-bold">
                <PriceBanner productBody={productBody} dateToday={dateToday} setDateToday={setDateToday} />
            </div>
        </div>
    )
}
