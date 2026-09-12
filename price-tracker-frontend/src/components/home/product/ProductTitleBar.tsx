import type { ProductBody } from '@/utils/Types'
import { PriceBanner } from '../price/PriceBanner'
import { ProductTitleDetails } from './ProductTitleDetails'

export interface ProductTitleBar {
    productBody: ProductBody
    storeString?: string
    dateToday: Date
    setDateToday: (newVal: Date) => void
}

export const ProductTitleBar = ({ productBody, storeString, dateToday, setDateToday }: ProductTitleBar) => {
    return (
        <div className='h-full min-h-11.25 w-full flex justify-between items-center pr-2'>
            <ProductTitleDetails
                product={productBody.product}
                storeString={storeString}
            />

            <div className='flex gap-3 items-center font-bold'>
                <PriceBanner
                    productBody={productBody}
                    dateToday={dateToday}
                    setDateToday={setDateToday}
                />
            </div>
        </div>
    )
}