import type { PriceType, ProductType } from '../../utils/Types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { usePriceDTO } from './usePriceDTO'
import { javaTimestampToJS } from '../../utils/DateUtilities'
import dayjs from 'dayjs'

export function useEditPrice(price: PriceType) {

    // PriceDTO for editing
    const priceDTO = usePriceDTO(
        {
            amount: parseFloat(price.amount).toFixed(2),
            currency: price.currency || '',
            priceStarted: price.priceStarted ? javaTimestampToJS(price.priceStarted) : '',
            priceEnded: price.priceEnded? javaTimestampToJS(price.priceEnded) : '',
            productId: price.productId,
            description: price.description
        }
    )

    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for editing prices
    const editPriceMutation = useMutation({
        mutationFn: () => {
            priceDTO.value.priceStarted = dayjs(priceDTO.value.priceStarted).format()
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

    const useEditPriceProps = {
        mutation: editPriceMutation,
        priceDTO: priceDTO
    }

    return useEditPriceProps
}