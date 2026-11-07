import { AxiosError, isAxiosError } from 'axios'

// The part of the backend's error responses (a ProblemDetail, RFC 9457) that explains what went wrong
type ProblemDetail = { detail: string }

const isProblemDetail = (data: unknown): data is ProblemDetail =>
    typeof data === 'object' && data !== null && 'detail' in data && typeof data.detail === 'string'

/**
 * Returns the message to show the user for an error. The backend explains rejected requests in the 'detail' of a
 * ProblemDetail response body, so that's shown when there is one. A timed out request has no response, so that gets
 * its own message.
 * @param error The error to describe
 * @returns The backend's message, a timeout message, or a generic message with the error
 */
const getErrorMessage = (error: Error) => {
    if (isAxiosError(error) && isProblemDetail(error.response?.data) && error.response.data.detail !== '') {
        return error.response.data.detail
    }

    if (isAxiosError(error) && error.code === AxiosError.ECONNABORTED) {
        return 'The server took too long to respond. Refresh and try again later.'
    }

    return `An error has occurred: ${error}`
}

export { getErrorMessage }
