import type { PriceType } from '../../../utils/Types'
import { getUSDateStringFromTimestamp } from '@/utils/DateUtilities'
import { getPriceString } from '@/utils/PriceUtilities'
import { Tooltip } from '@mantine/core'
import { MdDelete, MdEdit } from 'react-icons/md'

interface Price {
    price: PriceType
    openEditPriceModal: (price: PriceType) => void
    openDeletePriceModal: (price: PriceType) => void
}

export const Price = ({ price, openEditPriceModal, openDeletePriceModal }: Price) => {

    // Constructing the string to show the date on the PriceList
    const priceStartedDateString = getUSDateStringFromTimestamp(price.priceStarted)

    return (
        <div className="flex justify-between even:bg-cloud group/product">
            <div className="pl-2">
                {priceStartedDateString}
            </div>
            <div className="pr-2 flex items-center gap-1">
                <div>{getPriceString(price)}</div>
                <div
                    className='cursor-pointer'
                    onClick={(e) => { openEditPriceModal(price); e.stopPropagation() }}
                >
                    <Tooltip withArrow label="Edit Price"><MdEdit /></Tooltip>
                </div>
                <div
                    className='cursor-pointer'
                    onClick={(e) => { openDeletePriceModal(price); e.stopPropagation() }}
                >
                    <Tooltip withArrow label="Delete Price"><MdDelete /></Tooltip>
                </div>
            </div>
        </div>
    )
}