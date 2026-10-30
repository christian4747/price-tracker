import { AxiosError, isAxiosError } from 'axios'

/**
 * Returns the message to show the user for an error. The backend explains rejected requests in a plain text response
 * body, so that's shown when there is one. A timed out request has no response, so that gets its own message.
 * @param error The error to describe
 * @returns The backend's message, a timeout message, or a generic message with the error
 */
const getErrorMessage = (error: Error) => {
    if (isAxiosError(error) && typeof error.response?.data === 'string' && error.response.data !== '') {
        return error.response.data
    }

    if (isAxiosError(error) && error.code === AxiosError.ECONNABORTED) {
        return 'The server took too long to respond. Refresh and try again later.'
    }

    return `An error has occurred: ${error}`
}

export { getErrorMessage }
