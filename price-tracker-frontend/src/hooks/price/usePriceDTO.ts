import { useEffect, useReducer } from 'react'
import type { PriceDTO } from '../../utils/Types'

interface ReducerAction {
    type: 'set_field' | 'reset'
    key?: string
    value: number | string | PriceDTO | undefined
}

const createInitialPriceDTO = (initialPriceDTO: PriceDTO | undefined) => {
    if (initialPriceDTO) {
        return initialPriceDTO
    } else {
        return {
            amount: 0,
            currency: '',
            description: '',
            discountAmount: 0,
            discountPercentage: 0,
            priceEnded: '',
            priceStarted: '',
            productId: -1,
            returnAmount: 0,
            returnPercentage: 0
        }
    }
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

export function usePriceDTO(initialPriceDTO: PriceDTO | undefined) {

    const [state, dispatch] = useReducer(reducer, initialPriceDTO, createInitialPriceDTO)

    useEffect(() => {
        dispatch({ type: 'reset', value: createInitialPriceDTO(initialPriceDTO) })
    }, [initialPriceDTO])

    const setField = (key: string, value: number | string) => {
        dispatch({type: 'set_field', key, value})
    }

    const reset = () => {
        dispatch({ type: 'reset', value: createInitialPriceDTO(initialPriceDTO) })
    }

    const priceDTOProps = {
        value: state,
        setField: setField,
        reset: reset
    }

    return priceDTOProps
}