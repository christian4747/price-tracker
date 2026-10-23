import type { PriceDTO, PriceType } from '@/types/price'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import priceService from '@/services/priceService'
import { usePriceDTO } from '@/hooks/price/usePriceDTO'
import { getFormattedDateString } from '@/utils/dateUtils'
import dayjs from 'dayjs'
import { sendSuccessNotification } from '@/utils/notificationUtils'

export function useEditPrice(price: PriceType) {
    // PriceDTO for editing
    const priceDTO = usePriceDTO(price as PriceDTO)

    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for editing prices
    const editPriceMutation = useMutation({
        mutationFn: () => {
            return priceService.editPrice(price.priceId, {
                ...priceDTO.value,
                priceStarted: dayjs(priceDTO.value.priceStarted).format()
            })
        },
        onSuccess: (newPrice: PriceType) => {
            queryClient.invalidateQueries()
            sendSuccessNotification(`Successfully edited price ${getFormattedDateString(newPrice.priceStarted)}`)
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
