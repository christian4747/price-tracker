import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useToggleVisibility } from '../common/useToggleVisibility'
import { usePriceDTO } from './usePriceDTO'
import type { PriceType, ProductType } from '../../utils/Types'

export function useAddPrice(product: ProductType) {
    // State for AddPriceModal visibility
    const showAddPrice = useToggleVisibility(false)

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

    // Mutation for adding prices
    const addPriceMutation = useMutation({
        mutationFn: () => {
            showAddPrice.toggle()
            return api.addPrice(priceDTO.value)
        },
        onSuccess: (newData: PriceType) => {
            if (priceDTO.value.priceEnded && priceDTO.value.priceEnded.length > 0) {
                priceDTO.value.priceStarted = priceDTO.value.priceEnded
                priceDTO.value.priceEnded = ""
                updatePriceList(newData)
                addEndPriceMutation.mutate()
            } else {
                priceDTO.resetPriceDTO()
                updatePriceList(newData)
            }
        },
        onError: (error) => {
            console.log(`Error occurred while adding ${priceDTO} (${error.message})`)
        }
    })

    const addEndPriceMutation = useMutation({
        mutationFn: () => {
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
        visibility: showAddPrice,
        mutation: addPriceMutation,
        priceDTO: priceDTO
    }

    return useAddPriceProps
}