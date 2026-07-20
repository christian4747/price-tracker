import { MdEdit, MdDelete } from 'react-icons/md'
import type { PriceType } from '../../utils/Types'

type Props = {
    price: PriceType,
    priceStartedDateString: string,
    toggleShowEditPrice: () => void,
    toggleShowDeletePrice: () => void
}

const Price = ({price, priceStartedDateString, toggleShowEditPrice, toggleShowDeletePrice}: Props) => {
    return (
        <div className="flex justify-between even:bg-[#F4F4F4] group/product">
            <div className="pl-2">
                {priceStartedDateString}
            </div>
            <div className="pr-2 flex items-center gap-1">
                <div>${price.amount}</div>
                <div
                    className="hidden group-hover/product:block cursor-pointer"
                    onClick={toggleShowEditPrice}
                >
                    <MdEdit />
                </div>
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