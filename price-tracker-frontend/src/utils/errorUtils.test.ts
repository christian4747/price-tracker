import { describe, expect, test } from 'vitest'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { getErrorMessage } from './errorUtils'

// A failed request whose 400 response has the given body
const createAxiosError = (data: unknown) => {
    const response = { data, status: 400, statusText: '', headers: {}, config: { headers: new AxiosHeaders() } }
    return new AxiosError(
        'Request failed with status code 400',
        'ERR_BAD_REQUEST',
        undefined,
        undefined,
        response as AxiosResponse
    )
}

describe('getErrorMessage', () => {
    test("should return the backend's message for a rejected request", () => {
        expect(getErrorMessage(createAxiosError('Product already exists!'))).toBe('Product already exists!')
    })

    test('should return a generic message when the response has no text', () => {
        expect(getErrorMessage(createAxiosError(''))).toBe(
            'An error has occurred: AxiosError: Request failed with status code 400'
        )
        expect(getErrorMessage(createAxiosError({ error: 'Bad Request' }))).toBe(
            'An error has occurred: AxiosError: Request failed with status code 400'
        )
    })

    test('should explain that a timed out request took too long', () => {
        const timeoutError = new AxiosError('timeout of 10000ms exceeded', AxiosError.ECONNABORTED)

        expect(getErrorMessage(timeoutError)).toBe('The server took too long to respond. Refresh and try again later.')
    })

    test('should return a generic message for other errors', () => {
        expect(getErrorMessage(new Error('Something broke'))).toBe('An error has occurred: Error: Something broke')
    })
})
