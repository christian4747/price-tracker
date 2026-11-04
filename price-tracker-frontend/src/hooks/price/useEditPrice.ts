import type { PriceDTO, PriceType } from '@/types/price'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import priceService from '@/services/priceService'
import { usePriceDTO } from '@/hooks/price/usePriceDTO'
import { getFormattedDateTimeString } from '@/utils/dateUtils'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { sendSuccessNotification } from '@/utils/notificationUtils'

// Lets the modal around the form see whether a price is being edited
export const getEditPriceMutationKey = (priceId: number) => ['editPrice', priceId]

// The API's prices leave out their product, so the product's ID is passed in separately
export function useEditPrice(price: PriceType, productId: number) {
    // Memoized because the form resets whenever its starting values change, which would undo every edit if a new
    // object were built on each render
    const initialPriceDTO = useMemo<PriceDTO>(
        () => ({
            amount: price.amount,
            currency: price.currency,
            description: price.description,
            discountAmount: price.discountAmount,
            discountPercentage: price.discountPercentage,
            // The form uses an empty string for no end date, which the backend saves as null
            priceEnded: price.priceEnded ?? '',
            priceStarted: price.priceStarted,
            productId,
            returnAmount: price.returnAmount,
            returnPercentage: price.returnPercentage,
            totalAmount: price.totalAmount,
            totalPercentage: price.totalPercentage
        }),
        [price, productId]
    )
    const priceDTO = usePriceDTO(initialPriceDTO)

    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for editing prices
    const editPriceMutation = useMutation({
        mutationKey: getEditPriceMutationKey(price.priceId),
        mutationFn: () => {
            return priceService.editPrice(price.priceId, {
                ...priceDTO.value,
                priceStarted: dayjs(priceDTO.value.priceStarted).format()
            })
        },
        onSuccess: (newPrice: PriceType) => {
            queryClient.invalidateQueries()
            sendSuccessNotification(`Successfully edited price ${getFormattedDateTimeString(newPrice.priceStarted)}`)
        },
        onError: (error) => {
            console.log(`Error occurred while updating ${productId}: ${price.amount} (${error.message})`)
        }
    })

    const useEditPriceProps = {
        mutation: editPriceMutation,
        priceDTO: priceDTO
    }

    return useEditPriceProps
}
