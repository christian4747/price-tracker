import type { PriceType, RecentPriceData } from '../../../utils/Types'
import { EditPriceModal } from '../modals/EditPriceModal'
import DeletePriceModal from '../modals/DeletePriceModal'
import { getUSDateStringFromTimestamp } from '@/utils/DateUtilities'
import { getPriceString } from '@/utils/PriceUtilities'

interface Price {
    price: PriceType
    recentPriceData: RecentPriceData
}

export const Price = ({ price, recentPriceData }: Price) => {

    // Constructing the string to show the date on the PriceList
    const priceStartedDateString = getUSDateStringFromTimestamp(price.priceStarted)

    return (
        <div className="flex justify-between even:bg-cloud group/product">
            <div className="pl-2">
                {priceStartedDateString}
            </div>
            <div className="pr-2 flex items-center gap-1">
                <div>{getPriceString(price)}</div>
                <EditPriceModal price={price} recentPriceData={recentPriceData} />
                <DeletePriceModal price={price} />
            </div>
        </div>
    )
}