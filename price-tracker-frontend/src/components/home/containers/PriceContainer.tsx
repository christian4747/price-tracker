import EditPriceModal from '../modals/EditPriceModal'
import DeletePriceModal from '../modals/DeletePriceModal'
import type { PriceType } from "../../../utils/Types"
import Price from '../price/Price'
import api from '../../../services/api'
import { getUSDateStringFromTimestamp, javaTimestampToJS } from '../../../utils/DateUtilities'
import { useToggleVisibility } from '../../../hooks/useToggleVisibility'
import { usePriceDTO } from '../../../hooks/usePriceDTO'

type PriceProps = {
    price: PriceType
}

const PriceContainer = ({price}: PriceProps) => {
    // State for EditPriceModal visibility
    const showEditPrice = useToggleVisibility(false)
    // State for DeletePriceModal visibility
    const showDeletePrice = useToggleVisibility(false)

    // State for PriceDTO for editing Prices
    const priceDTO = usePriceDTO(
        {
            amount: parseFloat(price.amount).toFixed(2),
            currency: price.currency || '',
            priceStarted: price.priceStarted ? javaTimestampToJS(price.priceStarted) : '',
            priceEnded: price.priceEnded? javaTimestampToJS(price.priceEnded) : '',
            productId: price.productId
        }
    )

    // Constructing the string to show the date on the PriceList
    const priceStartedDateString = getUSDateStringFromTimestamp(price.priceStarted)

    // API function for editing a Price
    const editPrice = async () => {
        showEditPrice.toggle()
        try {
            const res = api.editPrice(price.priceId, priceDTO.value)
                .then(() => {
                    // TODO: Replace with mutation
                })

            console.log(res)
        } catch (err) {
            console.log('Error occurred while updating price')
            console.log(err)
        }
    }

    // API function for deleting a Price
    const deletePrice = async () => {
        showDeletePrice.toggle()

        try {
            const res = api.deletePrice(price.priceId)
            // TODO: Replace with mutation
            console.log(res)
        } catch(err) {
            console.log(`Error occurred while deleting ${price.priceId}: ${price.amount} ${price.priceStarted}`)
            console.log(err)
        }
    }

    return (
        <>
            <Price
                price={price}
                priceStartedDateString={priceStartedDateString}
                toggleShowEditPrice={showEditPrice.toggle}
                toggleShowDeletePrice={showDeletePrice.toggle}
            />

            <EditPriceModal
                hidden={showEditPrice.value}
                toggleHidden={showEditPrice.toggle}
                editPrice={editPrice}
                priceDTO={priceDTO.value}
                setPriceDTO={priceDTO.setPriceDTO}
            />

            <DeletePriceModal
                hidden={showDeletePrice.value}
                toggleHidden={showDeletePrice.toggle}
                price={price}
                deletePrice={deletePrice}
            />
        </>
    )
}

export default PriceContainer