import { useState } from 'react'
import EditPriceModal from '../modals/EditPriceModal'
import DeletePriceModal from '../modals/DeletePriceModal'
import type { PriceDTO, PriceType, ProductType } from "../../../utils/Types"
import Price from '../price/Price'
import api from '../../../services/api'
import { getUSDateStringFromTimestamp, javaTimestampToJS } from '../../../utils/DateUtilities'
import { useToggleVisibility } from '../../../hooks/useToggleVisibility'

type PriceProps = {
    price: PriceType,
    product: ProductType,
    setProduct: React.Dispatch<React.SetStateAction<ProductType>>
}

const PriceContainer = ({price, setProduct}: PriceProps) => {
    // State for EditPriceModal visibility
    const showEditPrice = useToggleVisibility(false)
    // State for DeletePriceModal visibility
    const showDeletePrice = useToggleVisibility(false)

    // State for PriceDTO for editing Prices
    const [priceDTO, setPriceDTO] = useState<PriceDTO>(
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
            const res = api.editPrice(price.priceId, priceDTO)
                .then(() => {
                    setProduct((prev) => {
                        const idx = prev.prices.indexOf(price)
                        const prices = prev.prices.map((p, i) => {
                            if (i === idx) {
                                p.amount = priceDTO.amount.toString()
                                p.priceStarted = priceDTO.priceStarted.toString()
                                p.priceEnded = priceDTO.priceEnded.toString()
                            }
                            return p
                        })

                        return ({...prev, prices: prices})
                    })
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
            setProduct((prev) => ({...prev, prices: prev.prices.filter((p) => p != price)}))
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
                priceDTO={priceDTO}
                setPriceDTO={setPriceDTO}
            />

            <DeletePriceModal
                hidden={showDeletePrice.value}
                toggleHidden={showDeletePrice.toggle}
                price={price}
                setProduct={setProduct}
                deletePrice={deletePrice}
            />
        </>
    )
}

export default PriceContainer