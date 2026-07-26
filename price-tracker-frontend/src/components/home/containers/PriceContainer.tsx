import EditPriceModal from '../modals/EditPriceModal'
import DeletePriceModal from '../modals/DeletePriceModal'
import type { PriceType, ProductType } from "../../../utils/Types"
import Price from '../price/Price'
import api from '../../../services/api'
import { getUSDateStringFromTimestamp } from '../../../utils/DateUtilities'
import { useToggleVisibility } from '../../../hooks/useToggleVisibility'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEditPrice } from '../../../hooks/useEditPrice'

type PriceProps = {
    price: PriceType
}

const PriceContainer = ({price}: PriceProps) => {
    // State for DeletePriceModal visibility
    const showDeletePrice = useToggleVisibility(false)

    const editPrice = useEditPrice(price)
 
    // Constructing the string to show the date on the PriceList
    const priceStartedDateString = getUSDateStringFromTimestamp(price.priceStarted)

    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for deleting prices
    const deletePriceMutation = useMutation({
        mutationFn: () => {
            showDeletePrice.toggle()
            return api.deletePrice(price.priceId)
        },
        onSuccess: () => {
            queryClient.setQueryData(['products'], (old: any) => {
                return old.map((p: ProductType) => {
                    if (p.productId === price.productId) {
                        const priceIdx = p.prices.indexOf(price)

                        const updatedPrices = p.prices.filter((price, i) => {
                            if (i === priceIdx) {
                                return
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
            console.log(`Error occurred while deleting ${price.priceId}: ${price.amount} ${price.priceStarted} (${error.message})`)
        }
    })

    return (
        <>
            <Price
                price={price}
                priceStartedDateString={priceStartedDateString}
                toggleShowEditPrice={editPrice.visibility.toggle}
                toggleShowDeletePrice={showDeletePrice.toggle}
            />

            <EditPriceModal
                hidden={editPrice.visibility.value}
                toggleHidden={editPrice.visibility.toggle}
                editPrice={editPrice.mutation.mutate}
                priceDTO={editPrice.priceDTO.value}
                setPriceDTO={editPrice.priceDTO.setPriceDTO}
            />

            <DeletePriceModal
                hidden={showDeletePrice.value}
                toggleHidden={showDeletePrice.toggle}
                price={price}
                deletePrice={deletePriceMutation.mutate}
            />
        </>
    )
}

export default PriceContainer