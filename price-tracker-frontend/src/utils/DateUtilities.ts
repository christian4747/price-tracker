import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import localizedFormat from 'dayjs/plugin/localizedFormat'

dayjs.extend(utc)
dayjs.extend(localizedFormat)

// Converts backend Java timestamps to frontend timestamps
const javaTimestampToJS = (timestamp: string) => {
    return timestamp?.slice(0, -8)
}

// Returns the given timestamp as a US date
const getUSDateStringFromTimestamp = (timestamp: string) => {
    const priceStartedDate = new Date(timestamp)
    return `${priceStartedDate.getMonth() + 1}/${priceStartedDate.getDate()}/${priceStartedDate.getFullYear()}`
}

// Converts the UTC date to local dayjs.Dayjs
const getLocalDateFromUTC = (utcDate: Date) => {
    return dayjs.utc(utcDate).local()
}

// Localize formats the given dayjs.Dayjs with the given string format
const localizeFormatDayjs = (toFormat: dayjs.Dayjs, stringFormat: string) => {
    return toFormat.format(stringFormat)
}

export { javaTimestampToJS, getUSDateStringFromTimestamp, getLocalDateFromUTC, localizeFormatDayjs }