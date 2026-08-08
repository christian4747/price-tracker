import type { PriceType, ProductType } from '../../utils/Types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'

export function useDeletePrice(price: PriceType) {

    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for deleting prices
    const deletePriceMutation = useMutation({
        mutationFn: () => {
            return api.deletePrice(price.priceId)
        },
        onSuccess: () => {
            queryClient.setQueryData(['products'], (old: any) => {
                return old.map((p: ProductType) => {
                    if (p.productId === price.productId) {
                        const priceIdx = p.prices.indexOf(price)

                        const updatedPrices = p.prices.filter((price, i) => {
                            if (i === priceIdx) {
                                return
                            }
                            return price
                        })

                        let productCopy = {...p}
                        productCopy = {...productCopy, prices: updatedPrices}
                        return productCopy
                    }
                    return p
                })
            })
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