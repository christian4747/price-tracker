import { ACTIVE_PRODUCTS } from '@/utils/FilterConstants'
import type { ProductActiveStatus, ProductFilterDTO } from '../../utils/Types'
import { useDTOReducer } from '../common/useDTOReducer'

const createInitialProductFilterDTO = (initialProductFilterDTO: ProductFilterDTO | undefined) => {
    if (initialProductFilterDTO) {
        return initialProductFilterDTO
    } else {
        return {
            active: ACTIVE_PRODUCTS as ProductActiveStatus,
            deleted: 'false'
        }
    }
}

export function useProductFilterDTO(initialProductFilterDTO?: ProductFilterDTO | undefined) {

    const { state, dispatch, setField, reset } = useDTOReducer(initialProductFilterDTO, createInitialProductFilterDTO)

    const setSearchTerm = (searchTerm: string) => {
        dispatch({ type: 'set_field', key: 'brand', value: searchTerm })
        dispatch({ type: 'set_field', key: 'name', value: searchTerm })
        dispatch({ type: 'set_field', key: 'store', value: searchTerm })
    }

    const useProductFilterDTOProps = {
        value: state,
        setField: setField,
        setSearchTerm: setSearchTerm,
        reset: reset
    }

    return useProductFilterDTOProps
}