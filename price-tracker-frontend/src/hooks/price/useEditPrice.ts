import type { PriceType, ProductType } from '../../utils/Types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { usePriceDTO } from './usePriceDTO'
import { getLocalDateFromUTC } from '../../utils/DateUtilities'
import dayjs from 'dayjs'

export function useEditPrice(price: PriceType) {

    // PriceDTO for editing
    const priceDTO = usePriceDTO(
        {
            amount: price.amount,
            currency: price.currency || '',
            priceStarted: price.priceStarted ? getLocalDateFromUTC(new Date(price.priceStarted)).format() : '',
            priceEnded: price.priceEnded ? getLocalDateFromUTC(new Date(price.priceEnded)).format() : '',
            productId: price.productId,
            description: price.description,
            returnAmount: price.returnAmount
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