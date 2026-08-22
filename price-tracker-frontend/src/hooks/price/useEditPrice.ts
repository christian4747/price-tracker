import type { PriceType } from '../../utils/Types'
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
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['products']})
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