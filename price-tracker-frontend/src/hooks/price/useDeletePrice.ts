import type { PriceType } from '../../utils/Types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { sendSuccessNotification } from '@/utils/NotificationUtilities'
import { getFormattedDateString } from '@/utils/DateUtilities'

export function useDeletePrice(price: PriceType) {

    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for deleting prices
    const deletePriceMutation = useMutation({
        mutationFn: () => {
            return api.deletePrice(price.priceId)
        },
        onSuccess: (oldPrice: PriceType) => {
            queryClient.invalidateQueries()
            sendSuccessNotification(`Successfully deleted price ${getFormattedDateString(oldPrice.priceStarted)}`)
        },
        onError: (error) => {
            console.log(`Error occurred while deleting ${price.priceId}: ${price.amount} ${price.priceStarted} (${error.message})`)
        }
    })

    const useDeletePriceProps = {
        mutation: deletePriceMutation
    }

    return useDeletePriceProps
}