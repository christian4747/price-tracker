import { describe, expect, test } from 'vitest'
import { apiClient } from './apiClient'

// Builds the query string the client would send for the given params
const getQuery = (params: object) => new URL(apiClient.getUri({ url: '/periods', params })).search

describe('apiClient', () => {
    test('should give up on requests after 10 seconds', () => {
        expect(apiClient.defaults.timeout).toBe(10000)
    })

    test('should send params that have values', () => {
        expect(getQuery({ store: 'Store 1', showDeleted: false })).toBe('?store=Store+1&showDeleted=false')
    })

    test('should leave out empty, undefined, and null params', () => {
        expect(getQuery({ name: '', store: undefined, brand: null, showDeleted: true })).toBe('?showDeleted=true')
    })
})
