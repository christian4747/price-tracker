import { useEffect, useReducer } from 'react'
import type { ProductDTO } from '../../utils/Types'

interface ReducerAction {
    type: 'set_field' | 'reset'
    key?: string
    value: boolean | string | ProductDTO
}

const createInitialProductDTO = (initialProductDTO: ProductDTO | undefined) => {
    if (initialProductDTO) {
        return initialProductDTO
    } else {
        return {
            name: '',
            link: '',
            store: '',
            active: true
        }
    }
}

const reducer = (state: ProductDTO, action: ReducerAction) => {
    switch (action.type) {
        case 'set_field': {
            const { key, value } = action
            if (!key || !value) return state

            return {
                ...state,
                [key]: value
            }
        }

        case 'reset':
            return action.value as ProductDTO

        default:
            return state
    }
}

export function useProductDTO(initialProductDTO: ProductDTO | undefined) {

    const [state, dispatch] = useReducer(reducer, initialProductDTO, createInitialProductDTO)

    useEffect(() => {
        dispatch({ type: 'reset', value: createInitialProductDTO(initialProductDTO) })
    }, [initialProductDTO])

    const setField = (key: string, value: boolean | string) => {
        dispatch({type: 'set_field', key, value})
    }

    const reset = () => {
        dispatch({ type: 'reset', value: createInitialProductDTO(initialProductDTO) })
    }

    const useProductDTOProps = {
        value: state,
        setField: setField,
        reset: reset
    }

    return useProductDTOProps
}