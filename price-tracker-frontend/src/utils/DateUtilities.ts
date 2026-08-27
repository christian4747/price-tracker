import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import localizedFormat from 'dayjs/plugin/localizedFormat'

dayjs.extend(utc)
dayjs.extend(localizedFormat)

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

/**
 * Returns the UTC time stamp string formatted in [MMM D, YYYY h:mm A] format (ex. Aug 16, 2018 8:02 PM)
 * @param timeStamp Time stamp string to convert to a formatted string
 * @returns The given UTC time stamp string converted to a formatted string
 */
const getFormattedDateString = (timeStamp: string) => {
    return localizeFormatDayjs(getLocalDateFromUTC(new Date(timeStamp)), 'lll')
}

export { getUSDateStringFromTimestamp, getLocalDateFromUTC, localizeFormatDayjs, getFormattedDateString }