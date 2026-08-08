import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { usePriceDTO } from './usePriceDTO'
import type { PriceType, ProductType } from '../../utils/Types'
import dayjs from 'dayjs'

export function useAddPrice(product: ProductType, highestPrice: number) {
    // State for PriceDTO when adding Prices
    const priceDTO = usePriceDTO(
        {
            amount: '0.00',
            currency: '',
            priceStarted: '',
            priceEnded: '',
            productId: product.productId,
            description: ''
        }
    )

    // Get the query client
    const queryClient = useQueryClient()

    // Function for updating price list
    const updatePriceList = (newData: PriceType) => {
        queryClient.setQueryData(['products'], (old: any) => {
            const idx = old.indexOf(product)
            return old.map((p: ProductType, i: number) => {
                if (i === idx) {
                    return p.prices ? {...p, prices: [...p.prices, newData]} : {...p, prices: [newData]}
                }
                return p
            })
        })
    }

    // Mutation for adding start date only
    const addSinglePriceMutation = useMutation({
        mutationFn: () => {
            priceDTO.value.priceStarted = dayjs(priceDTO.value.priceStarted).format()
            priceDTO.value.priceEnded = ''
            return api.addPrice(priceDTO.value)
        },
        onSuccess: (newData: PriceType) => {
            priceDTO.resetPriceDTO()
            updatePriceList(newData)
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
        onSuccess: (newData: PriceType) => {
            if (priceDTO.value.priceEnded && priceDTO.value.priceEnded.length > 0) {
                priceDTO.value.priceStarted = priceDTO.value.priceEnded
                priceDTO.value.priceEnded = ""
                addEndPriceMutation.mutate()
            }
            priceDTO.resetPriceDTO()
            updatePriceList(newData)
        },
        onError: (error) => {
            console.log(`Error occurred while adding ${priceDTO} (${error.message})`)
        }
    })

    // Chained mutation for adding end date
    const addEndPriceMutation = useMutation({
        mutationFn: () => {
            priceDTO.value.amount = highestPrice.toFixed(2)
            return api.addPrice(priceDTO.value)
        },
        onSuccess: (newData) => {
            updatePriceList(newData)
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