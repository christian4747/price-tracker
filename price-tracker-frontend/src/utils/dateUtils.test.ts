import { expect, test } from 'vitest'
import { getUSDateStringFromTimestamp } from './dateUtils'

test('timestamp to date is returned in format m/d/yyyy', () => {
    expect(getUSDateStringFromTimestamp(new Date(2026, 6, 30, 12).toISOString())).toBe('7/30/2026')
})
