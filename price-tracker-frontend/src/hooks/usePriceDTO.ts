import { useState } from 'react'
import type { PriceDTO } from '../utils/Types'

export function usePriceDTO(initialState: PriceDTO) {
    const [value, setPriceDTO] = useState<PriceDTO>(initialState)

    // Reset PriceDTO after adding a Price
    const resetPriceDTO = () => {
        setPriceDTO(
            {
                amount: '0.00',
                currency: '',
                priceStarted: '',
                priceEnded: '',
                productId: initialState.productId
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