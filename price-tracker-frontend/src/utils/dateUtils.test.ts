import { expect, test } from 'vitest'
import { getFormattedDateRangeString, getUSDateStringFromTimestamp } from './dateUtils'

test('timestamp to date is returned in format m/d/yyyy', () => {
    expect(getUSDateStringFromTimestamp(new Date(2026, 6, 30, 12).toISOString())).toBe('7/30/2026')
})

test('date range is returned as both dates and times joined by to', () => {
    // Built from local times so the expected text doesn't depend on the test machine's time zone
    const started = new Date(2026, 10, 27, 0, 0).toISOString()
    const ended = new Date(2026, 10, 30, 23, 59).toISOString()

    expect(getFormattedDateRangeString(started, ended)).toBe('Nov 27, 2026 12:00 AM to Nov 30, 2026 11:59 PM')
})
