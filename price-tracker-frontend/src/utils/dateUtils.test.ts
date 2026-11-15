import { expect, test } from 'vitest'
import { getFormattedDateRangeString, getFormattedDateString } from './dateUtils'

test('timestamp to date is returned as the short month, day, and year', () => {
    expect(getFormattedDateString(new Date(2026, 6, 30, 12).toISOString())).toBe('Jul 30, 2026')
})

test('timestamp to date uses the local day', () => {
    // 11:30 PM local time is already the next day in UTC for time zones ahead of it, and still the same day behind it
    expect(getFormattedDateString(new Date(2026, 6, 30, 23, 30).toISOString())).toBe('Jul 30, 2026')
    expect(getFormattedDateString(new Date(2026, 6, 30, 0, 30).toISOString())).toBe('Jul 30, 2026')
})

test('date range is returned as both dates and times joined by to', () => {
    // Built from local times so the expected text doesn't depend on the test machine's time zone
    const started = new Date(2026, 10, 27, 0, 0).toISOString()
    const ended = new Date(2026, 10, 30, 23, 59).toISOString()

    expect(getFormattedDateRangeString(started, ended)).toBe('Nov 27, 2026 12:00 AM to Nov 30, 2026 11:59 PM')
})
