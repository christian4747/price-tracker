import { describe, expect, test } from 'vitest'
import { apiClient } from './apiClient'

describe('apiClient', () => {
    test('should give up on requests after 10 seconds', () => {
        expect(apiClient.defaults.timeout).toBe(10000)
    })
})
