import { useState } from 'react'
import type { ProductDTO } from '../utils/Types'

export function useProductDTO(initialState: ProductDTO) {
    const [value, setProductDTO] = useState<ProductDTO>(initialState)

    // Reset PriceDTO after adding a Price
    const resetProductDTO = () => {
        setProductDTO(
            {
                name: '',
                link: '',
                store: ''
            }
        )
    }

    const productDTOProps = {
        value: value,
        setProductDTO: setProductDTO,
        resetProductDTO: resetProductDTO
    }

    return productDTOProps
}