import type { ProductType } from '@/utils/Types'
import PriceBanner from '../price/PriceBanner'
import { ProductTitleDetails } from './ProductTitleDetails'

export interface ProductTitleBar {
    product?: ProductType
    storeString?: string
    dateToday: Date
    setDateToday: (newVal: Date) => void
}

export const ProductTitleBar = ({ product, storeString, dateToday, setDateToday }: ProductTitleBar) => {
    if (!product) return <></>

    return (
        <div className='h-full min-h-11.25 w-full flex justify-between items-center pr-2'>
            <ProductTitleDetails
                product={product}
                storeString={storeString}
            />

            <div className='flex gap-3 items-center font-bold'>
                <PriceBanner
                    product={product}
                    dateToday={dateToday}
                    setDateToday={setDateToday}
                />
            </div>
        </div>
    )
}