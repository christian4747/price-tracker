import dayjs from 'dayjs'
import { useEffect, useState } from 'react'

const formatTime = (time: number | undefined) => {
    if (!time || time <= 0) return ''

    const days = Math.floor(time / 86400)
    const hours = Math.floor(time % 86400 / 3600)
    const mins = Math.floor(time % 3600 / 60)
    const secs = time % 60

    const dayString = days !== 0 ? days > 1 ? `${days.toString()} days, ` : `${days.toString()} day, ` : ``
    const hourString = hours !== 0 ? hours > 1 ? `${hours.toString()} hours, and ` : `${hours.toString()} hour, and ` : ``
    const minsString = mins > 0 ? mins > 1 ? `${mins.toString()} minutes` : `${mins.toString()} minute` : ``
    const andSecsString = secs > 0 && days === 0 && hours === 0 && mins < 5 && mins > 0 ? ` and ` : ``
    const secsString = secs > 0 && days === 0 && hours === 0 && mins < 5 ? secs === 0 || secs > 1 ? `${secs.toString()} seconds` : `${secs.toString()} second` : ``

    return dayString + hourString + minsString + andSecsString + secsString
}

export function useTimer(endMs: number, setDateToday: any) {

    let now = Date.now() / 1000
    let secondsLeftTilEnd: number | undefined = undefined
    if (endMs) {
        secondsLeftTilEnd = Math.floor(endMs - now)
    }

    const [timeText, setTimeText] = useState(formatTime(secondsLeftTilEnd))

    const updateTime = () => {
        now = Date.now() / 1000
        secondsLeftTilEnd = Math.floor(endMs - now)
        setTimeText(formatTime(secondsLeftTilEnd))
        if (secondsLeftTilEnd === 0) {
            setDateToday(dayjs().add(1, 'minute').toDate())
        }
    }

    useEffect(() => {
        let intervalId
        updateTime()

        if (secondsLeftTilEnd && secondsLeftTilEnd > 0) {
            intervalId = secondsLeftTilEnd > 300 ? setInterval(updateTime, 60000) : setInterval(updateTime, 500)
        } else if (intervalId && secondsLeftTilEnd && secondsLeftTilEnd <= 0) {
            clearInterval(intervalId)
        }

        if (intervalId) {
            return () => clearInterval(intervalId)
        }
    }, [secondsLeftTilEnd])

    return timeText
}