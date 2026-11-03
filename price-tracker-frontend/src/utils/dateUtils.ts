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
 * Returns the UTC time stamp string formatted in [MMM D, YYYY h:mm A] format with a 12-hour clock
 * (ex. Aug 16, 2018 8:02 PM)
 * @param timeStamp Time stamp string to convert to a formatted string
 * @returns The given UTC time stamp string converted to a formatted date and time string
 */
const getFormattedDateTimeString = (timeStamp: string) => {
    return localizeFormatDayjs(getLocalDateFromUTC(new Date(timeStamp)), 'MMM D, YYYY h:mm A')
}

/**
 * Returns a start and end time stamp as one range of formatted dates and times
 * (ex. Nov 27, 2026 12:00 AM to Nov 30, 2026 11:59 PM)
 * @param started Time stamp string of the start
 * @param ended Time stamp string of the end
 * @returns The two formatted date and time strings joined by "to"
 */
const getFormattedDateRangeString = (started: string, ended: string) => {
    return `${getFormattedDateTimeString(started)} to ${getFormattedDateTimeString(ended)}`
}

export {
    getUSDateStringFromTimestamp,
    getLocalDateFromUTC,
    localizeFormatDayjs,
    getFormattedDateTimeString,
    getFormattedDateRangeString
}
