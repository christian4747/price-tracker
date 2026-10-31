import type { PriceType } from '@/types/price'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import priceService from '@/services/priceService'
import { sendSuccessNotification } from '@/utils/notificationUtils'
import { getFormattedDateTimeString } from '@/utils/dateUtils'

export function usePermanentlyDeletePrice(price: PriceType) {
    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for permanently deleting prices that are already deleted
    const permanentlyDeletePriceMutation = useMutation({
        mutationFn: () => {
            return priceService.permanentlyDeletePrice(price.priceId)
        },
        onSuccess: (removedPrice: PriceType) => {
            queryClient.invalidateQueries()
            sendSuccessNotification(
                `Successfully permanently deleted price ${getFormattedDateTimeString(removedPrice.priceStarted)}`
            )
        },
        onError: (error) => {
            console.log(
                `Error occurred while permanently deleting ${price.priceId}: ${price.amount} ${price.priceStarted} (${error.message})`
            )
        }
    })

    const usePermanentlyDeletePriceProps = {
        mutation: permanentlyDeletePriceMutation
    }

    return usePermanentlyDeletePriceProps
}
