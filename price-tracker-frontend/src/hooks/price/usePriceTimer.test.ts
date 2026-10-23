import { afterEach, beforeEach, describe, expect, vi } from 'vitest'
import { act, renderHook, test } from '@/test-utils'
import { usePriceTimer } from './usePriceTimer'

const startMs = new Date('2026-10-24T12:00:00.000Z').getTime()
const secondsFromStart = (seconds: number) => startMs / 1000 + seconds

const advanceSeconds = (seconds: number) => {
    act(() => {
        vi.advanceTimersByTime(seconds * 1000)
    })
}

describe('usePriceTimer', () => {
    beforeEach(() => {
        vi.useFakeTimers({ now: startMs })
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    test('should return no text when there is no end time', () => {
        const setDateToday = vi.fn()
        const { result } = renderHook(() => usePriceTimer(undefined, setDateToday))

        advanceSeconds(5)

        expect(result.current).toBe('')
        expect(setDateToday).not.toHaveBeenCalled()
    })

    test('should count down each second in the last 5 minutes', () => {
        const { result } = renderHook(() => usePriceTimer(secondsFromStart(90), vi.fn()))

        advanceSeconds(0)
        expect(result.current).toBe('1 minute 30 seconds')

        advanceSeconds(1)
        expect(result.current).toBe('1 minute 29 seconds')
    })

    test('should update after each minute boundary when more than 5 minutes are left', () => {
        const { result } = renderHook(() => usePriceTimer(secondsFromStart(605), vi.fn()))

        advanceSeconds(0)
        expect(result.current).toBe('10 minutes')

        // 605 seconds left -> next tick 6 seconds later, at 599 seconds left
        advanceSeconds(6)
        expect(result.current).toBe('9 minutes')

        // 599 seconds left -> next tick 60 seconds later, at 539 seconds left
        advanceSeconds(59)
        expect(result.current).toBe('9 minutes')
        advanceSeconds(1)
        expect(result.current).toBe('8 minutes')
    })

    test('should call setDateToday once when the countdown reaches zero', () => {
        const setDateToday = vi.fn()
        renderHook(() => usePriceTimer(secondsFromStart(3), setDateToday))

        advanceSeconds(10)

        expect(setDateToday).toHaveBeenCalledTimes(1)
    })

    test('should call setDateToday when a late tick skips past zero', () => {
        const setDateToday = vi.fn()
        renderHook(() => usePriceTimer(secondsFromStart(3), setDateToday))
        advanceSeconds(2)

        // Simulate a throttled background tab: the clock moves on but the next tick runs late
        vi.setSystemTime(Date.now() + 1500)
        advanceSeconds(1)

        expect(setDateToday).toHaveBeenCalledTimes(1)
    })

    test('should not call setDateToday when the end time has already passed', () => {
        const setDateToday = vi.fn()
        const { result } = renderHook(() => usePriceTimer(secondsFromStart(-10), setDateToday))

        advanceSeconds(10)

        expect(result.current).toBe('')
        expect(setDateToday).not.toHaveBeenCalled()
    })
})
