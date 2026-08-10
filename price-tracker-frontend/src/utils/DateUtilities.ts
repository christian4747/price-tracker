// Converts backend Java timestamps to frontend timestamps
const javaTimestampToJS = (timestamp: string) => {
    return timestamp?.slice(0, -8)
}

// Returns the given timestamp as a US date
const getUSDateStringFromTimestamp = (timestamp: string) => {
    const priceStartedDate = new Date(timestamp)
    return `${priceStartedDate.getMonth() + 1}/${priceStartedDate.getDate()}/${priceStartedDate.getFullYear()}`
}

export { javaTimestampToJS, getUSDateStringFromTimestamp }