import { useEffect, useReducer } from 'react'

interface ReducerAction<T> {
    type: 'set_field' | 'reset'
    key?: string
    value: boolean | string | T
}

const reducer = <T> (state: T, action: ReducerAction<T>) => {
    switch (action.type) {
        case 'set_field': {
            const { key, value } = action
            if (!key || !value && value !== '') return state

            return {
                ...state,
                [key]: value
            }
        }

        case 'reset':
            return action.value as T

        default:
            return state
    }
}

export function useDTOReducer<T> (initialValue: T | undefined, initFunction: (initialValue: T | undefined) => T) {

    const [state, dispatch] = useReducer(reducer, initialValue, initFunction)

    useEffect(() => {
        dispatch({ type: 'reset', value: initFunction(initialValue) })
    }, [initialValue])

    const setField = (key: string, value: boolean | string) => {
        dispatch({type: 'set_field', key, value})
    }

    const reset = () => {
        dispatch({ type: 'reset', value: initFunction(initialValue) })
    }

    const useDTOReducerProps = {
        state: state,
        dispatch: dispatch,
        setField: setField,
        reset: reset
    }

    return useDTOReducerProps
}