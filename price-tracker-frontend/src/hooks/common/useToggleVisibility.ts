import { useState } from 'react'

export function useToggleVisibility(initialValue: boolean) {
    const [value, setValue] = useState(initialValue)

    const toggleValue = () => {
        setValue(!value)
    }

    const toggleVisbilityProps = {
        value: value,
        toggle: toggleValue
    }

    return toggleVisbilityProps
}