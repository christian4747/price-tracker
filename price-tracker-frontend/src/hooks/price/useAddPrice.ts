import { useMutation, useQueryClient } from '@tanstack/react-query'
import priceService from '@/services/priceService'
import { usePriceDTO } from '@/hooks/price/usePriceDTO'
import type { PriceDTO, PriceType } from '@/types/price'
import type { ProductType } from '@/types/product'
import dayjs from 'dayjs'
import { sendSuccessNotification } from '@/utils/notificationUtils'
import { getFormattedDateString, getLocalDateFromUTC } from '@/utils/dateUtils'
import { useState } from 'react'

// Lets the modal around the form see whether a price is being added
export const getAddPriceMutationKey = (productId: number) => ['addPrice', productId]

export function useAddPrice(product: ProductType, useEndDateDesc: boolean) {
    // Use state fixes this value (prevents useEffect refreshes)
    const [emptyPriceDTO] = useState<PriceDTO>({
        amount: 0,
        currency: '',
        description: '',
        discountAmount: 0,
        discountPercentage: 0,
        // Default to the end of the start day so the range starts out valid
        priceEnded: getLocalDateFromUTC(new Date()).endOf('day').second(0).format(),
        priceStarted: getLocalDateFromUTC(new Date()).format(),
        productId: product.productId,
        returnAmount: 0,
        returnPercentage: 0,
        totalAmount: 0,
        totalPercentage: 0
    })

    // State for PriceDTO when adding Prices
    const priceDTO = usePriceDTO(emptyPriceDTO)

    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for adding start date only
    const addSinglePriceMutation = useMutation({
        mutationKey: getAddPriceMutationKey(product.productId),
        mutationFn: () => {
            return priceService.addPrice({
                ...priceDTO.value,
                priceStarted: dayjs(priceDTO.value.priceStarted).format(),
                priceEnded: ''
            })
        },
        onSuccess: (newPrice: PriceType) => {
            priceDTO.reset()
            queryClient.invalidateQueries()
            sendSuccessNotification(`Successfully added price ${getFormattedDateString(newPrice.priceStarted)}`)
        },
        onError: (error) => {
            console.log(`Error occurred while adding ${priceDTO} (${error.message})`)
        }
    })

    // Mutation for adding start date and end date, which saves the price and the price that starts when it ends together
    const addPriceRangeMutation = useMutation({
        mutationKey: getAddPriceMutationKey(product.productId),
        mutationFn: () => {
            const { priceStarted, priceEnded } = priceDTO.value
            return priceService.addPriceRange({
                ...priceDTO.value,
                priceStarted: dayjs(priceStarted).format(),
                priceEnded: dayjs(priceEnded).format(),
                useEndDateDesc
            })
        },
        onSuccess: (newPrices: PriceType[]) => {
            priceDTO.reset()
            queryClient.invalidateQueries()
            newPrices.forEach((newPrice) => {
                sendSuccessNotification(`Successfully added price ${getFormattedDateString(newPrice.priceStarted)}`)
            })
        },
        onError: (error) => {
            console.log(`Error occurred while adding ${priceDTO} (${error.message})`)
        }
    })

    const useAddPriceProps = {
        mutation: addPriceRangeMutation,
        singleMutation: addSinglePriceMutation,
        priceDTO: priceDTO
    }

    return useAddPriceProps
}
