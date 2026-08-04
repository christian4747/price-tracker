import { expect, test } from 'vitest'
import { getUSDateStringFromTimestamp, javaTimestampToJS } from '../../src/utils/DateUtilities'

test('empty timestamp returns empty string', () => {
    expect(javaTimestampToJS('')).toBe('')
})

test('timestamp returns timestamp down to hours and minutes', () => {
    expect(javaTimestampToJS('2026-07-30T00:00:00.000Z')).toBe('2026-07-30T00:00')
})

test('timestamp to date is returned in format m/d/yyyy', () => {
    expect(getUSDateStringFromTimestamp('2026-07-30T00:00:00.000Z')).toBe('7/30/2026')
})