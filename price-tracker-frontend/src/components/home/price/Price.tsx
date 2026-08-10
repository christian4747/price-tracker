import type { PriceType } from '../../../utils/Types'
import EditPriceModal from '../modals/EditPriceModal'
import DeletePriceModal from '../modals/DeletePriceModal'
import { getUSDateStringFromTimestamp } from '@/utils/DateUtilities'

type PriceProps = {
    price: PriceType
}

const Price = ({price}: PriceProps) => {

    // Constructing the string to show the date on the PriceList
    const priceStartedDateString = getUSDateStringFromTimestamp(price.priceStarted)

    return (
        <div className="flex justify-between even:bg-cloud group/product">
            <div className="pl-2">
                {priceStartedDateString}
            </div>
            <div className="pr-2 flex items-center gap-1">
                <div>${parseFloat(price.amount).toFixed(2)}</div>
                <EditPriceModal price={price}/>
                <DeletePriceModal price={price}/>
            </div>
        </div>
    )
}

export default Price