import { describe, expect, test, vi } from 'vitest'
import dayjs from 'dayjs'
import { renderWithClient, screen, userEvent } from '@/test-utils'
import { PriceDateTimePicker } from './PriceDateTimePicker'

const afternoon = dayjs(new Date(2026, 8, 4, 14, 5)).format()

describe('Price Date Time Picker Component', () => {
    test('should show the date with a 12-hour time', () => {
        renderWithClient(<PriceDateTimePicker value={afternoon} />)

        expect(screen.getByText('Sep 4, 2026 2:05 PM')).toBeInTheDocument()
    })

    test.for([
        ['00:00', '2026-09-04 00:00'],
        ['23:59', '2026-09-04 23:59']
    ])('should pick the time from the %s preset', async ([preset, expected]) => {
        const onChange = vi.fn()
        const user = userEvent.setup()
        renderWithClient(<PriceDateTimePicker value={afternoon} onChange={onChange} />)

        await user.click(screen.getByText('Sep 4, 2026 2:05 PM'))
        await user.click(await screen.findByRole('button', { name: preset }))

        expect(dayjs(onChange.mock.lastCall?.[0]).format('YYYY-MM-DD HH:mm')).toBe(expected)
    })
})
