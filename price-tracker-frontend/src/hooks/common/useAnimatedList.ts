import autoAnimate from '@formkit/auto-animate'
import { useEffect, useRef } from 'react'

// Slides a list's items in and out as they're added and removed. Set up in an effect, not with the library's
// useAutoAnimate: in StrictMode that hook sets up the list twice without undoing the first, so every change is handled
// twice and the second pass cancels an added item's fade in. An effect's cleanup undoes the first set up
export function useAnimatedList<T extends HTMLElement>() {
    const listRef = useRef<T>(null)

    useEffect(() => {
        if (!listRef.current) return
        const controller = autoAnimate(listRef.current)
        return () => controller.destroy?.()
    }, [])

    return listRef
}
