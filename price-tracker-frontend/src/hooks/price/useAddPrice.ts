import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { usePriceDTO } from './usePriceDTO'
import type { ProductType } from '../../utils/Types'
import dayjs from 'dayjs'

export function useAddPrice(product: ProductType, highestPrice: number, useEndDateDesc: boolean) {
    // State for PriceDTO when adding Prices
    const priceDTO = usePriceDTO(
        {
            amount: 0.00,
            currency: '',
            priceStarted: '',
            priceEnded: '',
            productId: product.productId,
            description: '',
            returnAmount: 0
        }
    )

    // Get the query client
    const queryClient = useQueryClient()

    // Function for updating price list
    const updatePriceList = () => {
        queryClient.invalidateQueries({
            predicate: (query) => {
                return (query.queryKey[0] as string) === 'products' || (query.queryKey[0] as string) === 'productsGrouped'
            }
        })
    }

    // Mutation for adding start date only
    const addSinglePriceMutation = useMutation({
        mutationFn: () => {
            priceDTO.value.priceStarted = dayjs(priceDTO.value.priceStarted).format()
            priceDTO.value.priceEnded = ''
            return api.addPrice(priceDTO.value)
        },
        onSuccess: () => {
            priceDTO.resetPriceDTO()
            updatePriceList()
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
        onSuccess: () => {
            if (priceDTO.value.priceEnded && priceDTO.value.priceEnded.length > 0) {
                priceDTO.value.priceStarted = priceDTO.value.priceEnded
                priceDTO.value.priceEnded = ""
                addEndPriceMutation.mutate()
            }
            priceDTO.resetPriceDTO()
            updatePriceList()
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

            priceDTO.value.amount = highestPrice
            priceDTO.value.returnAmount = 0
            return api.addPrice(priceDTO.value)
        },
        onSuccess: () => {
            updatePriceList()
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