import dayjs from 'dayjs'
import { useEffect, useState } from 'react'

// Formats the given time into a string. The given time is expected to be in seconds.
const formatTime = (time: number | undefined) => {
    if (!time || time <= 0) return ''

    const days = Math.floor(time / 86400)
    const hours = Math.floor(time % 86400 / 3600)
    const mins = Math.floor(time % 3600 / 60)
    const secs = time % 60

    // days is not zero -> days greater than 1 -> plural text -> otherwise, singular text -> otherwise empty
    const dayString = days !== 0 ? days > 1 ? `${days.toString()} days ` : `${days.toString()} day ` : ``
    // hours is not zero -> hours greater than 1 -> plural text -> otherwise, singular text -> otherwise empty
    const hourString = hours !== 0 ? hours > 1 ? `${hours.toString()} hours ` : `${hours.toString()} hour ` : ``
    // mins is not zero -> mins greater than 1 -> plural text -> otherwise, singular text -> otherwise empty
    const minsString = mins !== 0 ? mins > 1 ? `${mins.toString()} minutes ` : `${mins.toString()} minute ` : ``
    // secs is not zero -> days, hours are 0, minutes are less than 5 -> plural text -> otherwise singular text -> otherwise empty
    const secsString = secs > 0 && days === 0 && hours === 0 && mins < 5 ? secs === 0 || secs > 1 ? `${secs.toString()} seconds` : `${secs.toString()} second` : ``

    return (dayString + hourString + minsString + secsString).trim()
}

export function usePriceTimer(endMs: number, setDateToday: any) {

    // Check if there exists a date after today for an ending deal
    let now = Date.now() / 1000
    let secondsLeftTilEnd: number | undefined = undefined
    if (endMs) {
        secondsLeftTilEnd = Math.floor(endMs - now)
    }

    // Set the timer text
    const [timeText, setTimeText] = useState(formatTime(secondsLeftTilEnd))

    // Update the timer text. If the timer is over, update the list's today's date state
    const updateTime = () => {
        now = Date.now() / 1000
        secondsLeftTilEnd = Math.floor(endMs - now)
        setTimeText(formatTime(secondsLeftTilEnd))
        if (secondsLeftTilEnd === 0) {
            setDateToday(dayjs().add(1, 'minute').toDate())
        }
    }

    // Use effect for managing the interval
    useEffect(() => {
        let intervalId
        updateTime()
        if (secondsLeftTilEnd && secondsLeftTilEnd > 0) {
            // Use + 1 offset because time updates around a second faster
            intervalId = secondsLeftTilEnd >= 300 ? setInterval(updateTime, (secondsLeftTilEnd % 60 + 1) * 1000) : setInterval(updateTime, 1000)
        } else if (intervalId && secondsLeftTilEnd && secondsLeftTilEnd <= 0) {
            clearInterval(intervalId)
        }

        if (intervalId) {
            return () => clearInterval(intervalId)
        }
    }, [secondsLeftTilEnd])

    return timeText
}