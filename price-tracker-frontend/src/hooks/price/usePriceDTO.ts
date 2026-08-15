import { useState } from 'react'
import type { PriceDTO } from '../../utils/Types'

export function usePriceDTO(initialState: PriceDTO) {
    const [value, setPriceDTO] = useState<PriceDTO>(initialState)

    // Reset PriceDTO after adding a Price
    const resetPriceDTO = () => {
        setPriceDTO(
            {
                amount: '0.00',
                currency: '',
                description: '',
                priceStarted: '',
                priceEnded: '',
                productId: initialState.productId,
                returnAmount: 0
            }
        )
    }

    const priceDTOProps = {
        value: value,
        setPriceDTO: setPriceDTO,
        resetPriceDTO: resetPriceDTO
    }

    return priceDTOProps
}