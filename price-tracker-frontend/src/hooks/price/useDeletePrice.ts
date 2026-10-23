import type { PriceType } from '@/types/price'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import priceService from '@/services/priceService'
import { sendSuccessNotification } from '@/utils/notificationUtils'
import { getFormattedDateString } from '@/utils/dateUtils'

export function useDeletePrice(price: PriceType) {
    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for deleting prices
    const deletePriceMutation = useMutation({
        mutationFn: () => {
            return priceService.deletePrice(price.priceId)
        },
        onSuccess: (oldPrice: PriceType) => {
            queryClient.invalidateQueries()
            sendSuccessNotification(`Successfully deleted price ${getFormattedDateString(oldPrice.priceStarted)}`)
        },
        onError: (error) => {
            console.log(
                `Error occurred while deleting ${price.priceId}: ${price.amount} ${price.priceStarted} (${error.message})`
            )
        }
    })

    const useDeletePriceProps = {
        mutation: deletePriceMutation
    }

    return useDeletePriceProps
}
