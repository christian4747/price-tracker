import { useRef, useState } from 'react'

// Uses debounce to set a value and ignore inputs for the delay time
export function useDebounce<T>(initialValue: T, delay: number = 5000) {

    const [value, setValue] = useState(initialValue)
    const debounce = useRef(false)

    const setValueWithDebounce = (newVal: T) => {
        if (debounce.current) return
        debounce.current = true

        setValue(newVal)

        setTimeout(() => {
            debounce.current = false
        }, delay)
    }

    const debounceProps = {
        value: value,
        setValueWithDebounce: setValueWithDebounce
    }

    return debounceProps
}