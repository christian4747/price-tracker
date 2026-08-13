import dayjs from "dayjs"
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

// Converts backend Java timestamps to frontend timestamps
const javaTimestampToJS = (timestamp: string) => {
    return timestamp?.slice(0, -8)
}

// Returns the given timestamp as a US date
const getUSDateStringFromTimestamp = (timestamp: string) => {
    const priceStartedDate = new Date(timestamp)
    return `${priceStartedDate.getMonth() + 1}/${priceStartedDate.getDate()}/${priceStartedDate.getFullYear()}`
}

const getLocalDateFromUTC = (utcDate: Date) => {
    return dayjs.utc(utcDate).local()
}

export { javaTimestampToJS, getUSDateStringFromTimestamp, getLocalDateFromUTC }