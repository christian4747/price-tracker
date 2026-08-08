import { MdDelete } from 'react-icons/md'
import type { PriceType } from '../../../utils/Types'
import EditPriceModal from '../modals/EditPriceModal'

type Props = {
    price: PriceType,
    priceStartedDateString: string,
    toggleShowDeletePrice: () => void
}

const Price = ({price, priceStartedDateString, toggleShowDeletePrice}: Props) => {
    return (
        <div className="flex justify-between even:bg-cloud group/product">
            <div className="pl-2">
                {priceStartedDateString}
            </div>
            <div className="pr-2 flex items-center gap-1">
                <div>${parseFloat(price.amount).toFixed(2)}</div>
                <EditPriceModal price={price}/>
                <div
                    className="hidden group-hover/product:block cursor-pointer"
                    onClick={toggleShowDeletePrice}
                >
                    <MdDelete />
                </div>
            </div>
        </div>
    )
}

export default Price