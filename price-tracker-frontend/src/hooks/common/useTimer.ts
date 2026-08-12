import { useEffect, useRef, useState } from 'react'

const formatTime = (time: number) => {
    const days = Math.floor(time / 86400)
    const hours = Math.floor(time % 86400 / 3600)
    const mins = Math.floor(time % 3600 / 60)
    const secs = time % 60
    return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function useTimer(endMs: number) {

    const now = Date.now() / 1000
    const secondsLeftTilEnd = Math.floor(endMs - now)

    const [timeText, setTimeText] = useState(formatTime(secondsLeftTilEnd))
    const [secondsLeft, setSecondsLeft] = useState(endMs)
    const timerRef = useRef(0)

    useEffect(() => {
        if (secondsLeftTilEnd > 0) {
            timerRef.current = setInterval(() => {
                setSecondsLeft(prev => {
                    const now = Date.now() / 1000
                    return Math.floor(prev - now)
                })
                setTimeText(formatTime(secondsLeftTilEnd))
            }, 500)
        } else if (secondsLeftTilEnd <= 0) {
            clearInterval(timerRef.current)
        }

        return () => clearInterval(timerRef.current)
    }, [secondsLeft])

    const timerProps = {
        value: timeText
    }

    return timerProps
}