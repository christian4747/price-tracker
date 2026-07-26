import EditPriceModal from '../modals/EditPriceModal'
import DeletePriceModal from '../modals/DeletePriceModal'
import type { PriceType, ProductType } from "../../../utils/Types"
import Price from '../price/Price'
import api from '../../../services/api'
import { getUSDateStringFromTimestamp, javaTimestampToJS } from '../../../utils/DateUtilities'
import { useToggleVisibility } from '../../../hooks/useToggleVisibility'
import { usePriceDTO } from '../../../hooks/usePriceDTO'
import { useMutation, useQueryClient } from '@tanstack/react-query'

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

    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for editing products
    const editPriceMutation = useMutation({
        mutationFn: () => {
            showEditPrice.toggle()
            return api.editPrice(price.priceId, priceDTO.value)
        },
        onSuccess: (newData) => {
            queryClient.setQueryData(['products'], (old: any) => {
                return old.map((p: ProductType) => {
                    if (p.productId === price.productId) {
                        const priceIdx = p.prices.indexOf(price)

                        const updatedPrices = p.prices.map((price, i) => {
                            if (i === priceIdx) {
                                return newData
                            }
                            return price
                        })

                        let productCopy = {...p}
                        productCopy = {...productCopy, prices: updatedPrices}
                        return productCopy
                    }
                    return p
                })
            })
        },
        onError: (error) => {
            console.log(`Error occurred while updating ${price.productId}: ${price.amount} (${error.message})`)
        }
    })

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
                editPrice={editPriceMutation.mutate}
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