import { expect, test } from 'vitest'
import { getUSDateStringFromTimestamp } from '../../src/utils/DateUtilities'

test('timestamp to date is returned in format m/d/yyyy', () => {
    expect(getUSDateStringFromTimestamp('2026-07-30T00:00:00.000Z')).toBe('7/30/2026')
})