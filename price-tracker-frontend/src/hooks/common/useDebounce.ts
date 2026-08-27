import { useRef, useState } from 'react'

// Uses debounce to set a value and ignore inputs for the delay time
export function useDebounce<T>(initialValue: T, delay: number = 5000) {

    // State for storing the value
    const [value, setValue] = useState(initialValue)
    // Reference for the debounce timeout
    const debounce = useRef(false)

    /**
     * Sets the stored value then disables setting the value again for the debounce delay duration.
     * @param newVal The new value to set
     */
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