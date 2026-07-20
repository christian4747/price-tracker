import { useState } from 'react'
import EditPriceModal from './EditPriceModal'
import DeletePriceModal from './DeletePriceModal'
import type { PriceDTO, PriceType, ProductType } from "../../utils/Types"
import Price from './Price'
import api from '../../services/api'

type PriceModalSettings = {
    showEditPrice: boolean,
    showDeletePrice: boolean
}

type PriceProps = {
    price: PriceType,
    product: ProductType,
    setProduct: React.Dispatch<React.SetStateAction<ProductType>>
}

const PriceContainer = ({price, setProduct}: PriceProps) => {
    // State for EditPriceModal and DeletePriceModal visibility
    const [priceModalSettings, setPriceModalSettings] = useState<PriceModalSettings>
    (
        {
            showEditPrice: false,
            showDeletePrice: false
        }
    )

    // State for PriceDTO for editing Prices
    const [priceDTO, setPriceDTO] = useState<PriceDTO>(
        {
            amount: parseFloat(price.amount),
            currency: price.currency || '',
            priceStarted: price.priceStarted || '',
            priceEnded: price.priceEnded || '',
            productId: price.productId
        }
    )

    // Toggle EditPriceModal visibility
    const toggleShowEdit = () => {
        setPriceModalSettings(prev => ({...prev, showEditPrice: !prev.showEditPrice}))
    }

    // Toggle DeletePriceModal visibility
    const toggleShowDelete = () => {
        setPriceModalSettings(prev => ({...prev, showDeletePrice: !prev.showDeletePrice}))
    }

    // Constructing the string to show the date on the PriceList
    const priceStartedDate = new Date(price.priceStarted)
    const priceStartedDateString = `${priceStartedDate.getMonth() + 1}/${priceStartedDate.getDate()}/${priceStartedDate.getFullYear()}`

    // API function for editing a Price
    const editPrice = async () => {
        toggleShowEdit()
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
        toggleShowDelete()

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
                toggleShowEditPrice={toggleShowEdit}
                toggleShowDeletePrice={toggleShowDelete}
            />

            <EditPriceModal
                hidden={priceModalSettings.showEditPrice}
                toggleHidden={toggleShowEdit}
                editPrice={editPrice}
                priceDTO={priceDTO}
                setPriceDTO={setPriceDTO}
            />

            <DeletePriceModal
                hidden={priceModalSettings.showDeletePrice}
                toggleHidden={toggleShowDelete}
                price={price}
                setProduct={setProduct}
                deletePrice={deletePrice}
            />
        </>
    )
}

export default PriceContainer