import EditPriceModal from '../modals/EditPriceModal'
import DeletePriceModal from '../modals/DeletePriceModal'
import type { PriceType } from "../../../utils/Types"
import Price from '../price/Price'
import { getUSDateStringFromTimestamp } from '../../../utils/DateUtilities'
import { useEditPrice } from '../../../hooks/price/useEditPrice'
import { useDeletePrice } from '../../../hooks/price/useDeletePrice'

type PriceProps = {
    price: PriceType
}

const PriceContainer = ({price}: PriceProps) => {

    // Hook for editing prices
    const editPrice = useEditPrice(price)
    // Hook for deleting prices
    const deletePrice = useDeletePrice(price)

    // Constructing the string to show the date on the PriceList
    const priceStartedDateString = getUSDateStringFromTimestamp(price.priceStarted)

    return (
        <>
            <Price
                price={price}
                priceStartedDateString={priceStartedDateString}
                toggleShowEditPrice={editPrice.visibility.toggle}
                toggleShowDeletePrice={deletePrice.visibility.toggle}
            />

            <EditPriceModal
                hidden={editPrice.visibility.value}
                toggleHidden={editPrice.visibility.toggle}
                editPrice={editPrice.mutation.mutate}
                priceDTO={editPrice.priceDTO.value}
                setPriceDTO={editPrice.priceDTO.setPriceDTO}
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