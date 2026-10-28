import type { PriceType } from '@/types/price'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import priceService from '@/services/priceService'
import { sendSuccessNotification } from '@/utils/notificationUtils'
import { getFormattedDateTimeString } from '@/utils/dateUtils'

export function useRestorePrice(price: PriceType) {
    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for restoring deleted prices
    const restorePriceMutation = useMutation({
        mutationFn: () => {
            return priceService.restorePrice(price.priceId)
        },
        onSuccess: (restoredPrice: PriceType) => {
            queryClient.invalidateQueries()
            sendSuccessNotification(
                `Successfully restored price ${getFormattedDateTimeString(restoredPrice.priceStarted)}`
            )
        },
        onError: (error) => {
            console.log(
                `Error occurred while restoring ${price.priceId}: ${price.amount} ${price.priceStarted} (${error.message})`
            )
        }
    })

    const useRestorePriceProps = {
        mutation: restorePriceMutation
    }

    return useRestorePriceProps
}
