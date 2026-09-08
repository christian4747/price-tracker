import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { usePriceDTO } from './usePriceDTO'
import type { PriceDTO, PriceType, ProductType } from '../../utils/Types'
import dayjs from 'dayjs'
import { sendSuccessNotification } from '@/utils/NotificationUtilities'
import { getFormattedDateString, getLocalDateFromUTC } from '@/utils/DateUtilities'
import { useState } from 'react'

export function useAddPrice(product: ProductType, useEndDateDesc: boolean) {

    // Use state fixes this value (prevents useEffect refreshes)
    const [emptyPriceDTO,] = useState<PriceDTO>({
        amount: 0,
        currency: '',
        description: '',
        discountAmount: 0,
        discountPercentage: 0,
        priceEnded: getLocalDateFromUTC(new Date()).format(),
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
            priceDTO.value.priceStarted = dayjs(priceDTO.value.priceStarted).format()
            priceDTO.value.priceEnded = ''
            return api.addPrice(priceDTO.value)
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
            if (priceDTO.value.priceEnded && priceDTO.value.priceEnded.length > 0) {
                priceDTO.value.priceEnded = dayjs(priceDTO.value.priceEnded).format()
            }

            priceDTO.value.priceStarted = dayjs(priceDTO.value.priceStarted).format()
            return api.addPrice(priceDTO.value)
        },
        onSuccess: (newPrice: PriceType) => {
            if (priceDTO.value.priceEnded && priceDTO.value.priceEnded.length > 0) {
                priceDTO.value.priceStarted = priceDTO.value.priceEnded
                priceDTO.value.priceEnded = ""
                addEndPriceMutation.mutate()
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
        mutationFn: () => {
            console.log(useEndDateDesc)
            if (!useEndDateDesc) {
                priceDTO.value.description = ''
            }

            priceDTO.value.discountAmount = priceDTO.value.amount
            priceDTO.value.discountPercentage = 0
            priceDTO.value.returnAmount = 0
            priceDTO.value.returnPercentage = 0
            return api.addPrice(priceDTO.value)
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