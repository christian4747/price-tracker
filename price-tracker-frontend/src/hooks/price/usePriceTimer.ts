import dayjs from 'dayjs'
import { useEffect, useEffectEvent, useState } from 'react'

// Formats the given time into a string. The given time is expected to be in seconds.
const formatTime = (time: number | undefined) => {
    if (!time || time <= 0) return ''

    const days = Math.floor(time / 86400)
    const hours = Math.floor((time % 86400) / 3600)
    const mins = Math.floor((time % 3600) / 60)
    const secs = time % 60

    // days is not zero -> days greater than 1 -> plural text -> otherwise, singular text -> otherwise empty
    const dayString = days !== 0 ? (days > 1 ? `${days.toString()} days ` : `${days.toString()} day `) : ``
    // hours is not zero -> hours greater than 1 -> plural text -> otherwise, singular text -> otherwise empty
    const hourString = hours !== 0 ? (hours > 1 ? `${hours.toString()} hours ` : `${hours.toString()} hour `) : ``
    // mins is not zero -> mins greater than 1 -> plural text -> otherwise, singular text -> otherwise empty
    const minsString = mins !== 0 ? (mins > 1 ? `${mins.toString()} minutes ` : `${mins.toString()} minute `) : ``
    // secs is not zero -> days, hours are 0, minutes are less than 5 -> plural text -> otherwise singular text -> otherwise empty
    const secsString =
        secs > 0 && days === 0 && hours === 0 && mins < 5
            ? secs === 0 || secs > 1
                ? `${secs.toString()} seconds`
                : `${secs.toString()} second`
            : ``

    return (dayString + hourString + minsString + secsString).trim()
}

const getSecondsLeft = (endSeconds: number, nowMs: number) => Math.floor(endSeconds - nowMs / 1000)

/**
 * Counts down to the given end time and returns the time left as text.
 * @param endSeconds The end time in Unix seconds, or undefined for no timer
 * @param setDateToday Called when a running countdown reaches zero
 */
export function usePriceTimer(endSeconds: number | undefined, setDateToday: (newVal: Date) => void) {
    // Current time in ms, updated by the timer. Undefined until the first tick.
    const [nowMs, setNowMs] = useState<number | undefined>(undefined)

    // Reads the latest setDateToday without restarting the timer when it changes
    const onTimerEnd = useEffectEvent(() => {
        setDateToday(dayjs().add(1, 'minute').toDate())
    })

    useEffect(() => {
        if (endSeconds === undefined) return

        let timeoutId: ReturnType<typeof setTimeout>
        let wasCountingDown = false

        const tick = () => {
            const tickMs = Date.now()
            setNowMs(tickMs)

            const secondsLeft = getSecondsLeft(endSeconds, tickMs)
            if (secondsLeft > 0) {
                wasCountingDown = true
                // Tick every second in the last 5 minutes, otherwise just after each minute boundary
                const delay = secondsLeft >= 300 ? ((secondsLeft % 60) + 1) * 1000 : 1000
                timeoutId = setTimeout(tick, delay)
            } else if (wasCountingDown) {
                onTimerEnd()
            }
        }

        // Schedule the first tick instead of calling it here, so state isn't set synchronously inside the effect
        timeoutId = setTimeout(tick, 0)

        return () => clearTimeout(timeoutId)
    }, [endSeconds])

    if (endSeconds === undefined || nowMs === undefined) return ''
    return formatTime(getSecondsLeft(endSeconds, nowMs))
}
