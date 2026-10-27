import { useMutation, useQueryClient } from '@tanstack/react-query'
import priceService from '@/services/priceService'
import { usePriceDTO } from '@/hooks/price/usePriceDTO'
import type { PriceDTO, PriceType } from '@/types/price'
import type { ProductType } from '@/types/product'
import dayjs from 'dayjs'
import { sendSuccessNotification } from '@/utils/notificationUtils'
import { getFormattedDateString, getLocalDateFromUTC } from '@/utils/dateUtils'
import { useState } from 'react'

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

    // Mutation for adding start date and end date
    const addPriceMutation = useMutation({
        mutationFn: () => {
            const { priceStarted, priceEnded } = priceDTO.value
            return priceService.addPrice({
                ...priceDTO.value,
                priceStarted: dayjs(priceStarted).format(),
                priceEnded: priceEnded ? dayjs(priceEnded).format() : priceEnded
            })
        },
        onSuccess: (newPrice: PriceType) => {
            // Add the price that starts when this one ends, returning to the base amount
            const { priceEnded, description, amount } = priceDTO.value
            if (priceEnded) {
                addEndPriceMutation.mutate({
                    ...priceDTO.value,
                    priceStarted: dayjs(priceEnded).format(),
                    priceEnded: '',
                    description: useEndDateDesc ? description : '',
                    discountAmount: amount,
                    discountPercentage: 0,
                    returnAmount: 0,
                    returnPercentage: 0
                })
            }

            priceDTO.reset()
            queryClient.invalidateQueries()
            sendSuccessNotification(`Successfully added price ${getFormattedDateString(newPrice.priceStarted)}`)
        },
        onError: (error) => {
            console.log(`Error occurred while adding ${priceDTO} (${error.message})`)
        }
    })

    // Chained mutation for adding end date
    const addEndPriceMutation = useMutation({
        mutationFn: (endPriceDTO: PriceDTO) => {
            return priceService.addPrice(endPriceDTO)
        },
        onSuccess: (newPrice: PriceType) => {
            queryClient.invalidateQueries()
            sendSuccessNotification(`Successfully added price ${getFormattedDateString(newPrice.priceStarted)}`)
        },
        onError: (error) => {
            console.log(`Error occurred while adding ${priceDTO} (${error.message})`)
        }
    })

    const useAddPriceProps = {
        mutation: addPriceMutation,
        singleMutation: addSinglePriceMutation,
        priceDTO: priceDTO
    }

    return useAddPriceProps
}
