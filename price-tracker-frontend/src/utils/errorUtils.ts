import { isAxiosError } from 'axios'

/**
 * Returns the message to show the user for an error. The backend explains rejected requests in a plain text response
 * body, so that's shown when there is one.
 * @param error The error to describe
 * @returns The backend's message, or a generic message with the error
 */
const getErrorMessage = (error: Error) => {
    if (isAxiosError(error) && typeof error.response?.data === 'string' && error.response.data !== '') {
        return error.response.data
    }

    return `An error has occurred: ${error}`
}

export { getErrorMessage }
