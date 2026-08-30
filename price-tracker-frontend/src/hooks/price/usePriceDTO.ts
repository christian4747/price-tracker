import { useReducer, useRef } from 'react'
import type { PriceDTO } from '../../utils/Types'

interface ReducerAction {
    type: 'set_field' | 'reset'
    key?: string
    value: number | string | PriceDTO
}

const reducer = (state: PriceDTO, action: ReducerAction) => {
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
            return action.value as PriceDTO

        default:
            return state
    }
}

export function usePriceDTO(initialPriceDTO: PriceDTO) {

    const initialPriceDTOState = useRef(initialPriceDTO)
    const [state, dispatch] = useReducer(reducer, initialPriceDTOState.current)

    const setField = (key: string, value: number | string) => {
        dispatch({type: 'set_field', key, value})
    }

    const reset = () => {
        dispatch({ type: 'reset', value: initialPriceDTOState.current })
    }

    const priceDTOProps = {
        value: state,
        setField: setField,
        reset: reset
    }

    return priceDTOProps
}