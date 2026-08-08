import DeletePriceModal from '../modals/DeletePriceModal'
import type { PriceType } from "../../../utils/Types"
import Price from '../price/Price'
import { getUSDateStringFromTimestamp } from '../../../utils/DateUtilities'
import { useDeletePrice } from '../../../hooks/price/useDeletePrice'

type PriceProps = {
    price: PriceType
}

const PriceContainer = ({price}: PriceProps) => {

    // Hook for deleting prices
    const deletePrice = useDeletePrice(price)

    // Constructing the string to show the date on the PriceList
    const priceStartedDateString = getUSDateStringFromTimestamp(price.priceStarted)

    return (
        <>
            <Price
                price={price}
                priceStartedDateString={priceStartedDateString}
                toggleShowDeletePrice={deletePrice.visibility.toggle}
            />

            <DeletePriceModal
                hidden={deletePrice.visibility.value}
                toggleHidden={deletePrice.visibility.toggle}
                price={price}
                deletePrice={deletePrice.mutation.mutate}
            />
        </>
    )
}

export default PriceContainer