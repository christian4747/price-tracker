import { useState } from 'react'
import type { ProductDTO } from '@/types/product'

const isBlank = (value: string | null) => !value || value.trim() === ''

export function useRequiredProductFields(productDTO: ProductDTO) {
    // Messages only show after a save is tried, so an empty modal doesn't open with errors
    const [saveTried, setSaveTried] = useState(false)

    const nameError = saveTried && isBlank(productDTO.name) ? 'Name is required' : undefined
    const storeError = saveTried && isBlank(productDTO.store) ? 'Store is required' : undefined

    // Returns whether the product can be saved, showing the messages if it can't
    const checkRequiredFields = () => {
        setSaveTried(true)
        return !isBlank(productDTO.name) && !isBlank(productDTO.store)
    }

    // Hides the messages again, for when the modal starts over
    const resetRequiredFields = () => setSaveTried(false)

    const useRequiredProductFieldsProps = {
        nameError,
        storeError,
        checkRequiredFields,
        resetRequiredFields
    }

    return useRequiredProductFieldsProps
}
