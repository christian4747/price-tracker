import { describe, expect } from 'vitest'
import type { SetupWorker } from 'msw/browser'
import { createPeriod, renderWithClient, screen, test, userEvent, waitFor, within } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import type { PeriodType } from '@/types/period'
import { PeriodsModal } from './PeriodsModal'

const periodsApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/periods'

// Built from local times so the expected text doesn't depend on the test machine's time zone
const blackFriday = createPeriod(1, {
    name: 'Black Friday',
    store: 'Store 1',
    periodStarted: new Date(2026, 10, 27, 0, 0).toISOString(),
    periodEnded: new Date(2026, 10, 30, 23, 59).toISOString()
})
const cardCashback = createPeriod(2, { name: 'Card cashback', type: 'RETURN', store: null })
const deletedSale = createPeriod(3, { name: 'Old sale', deletedAt: new Date(2026, 9, 1, 12).toISOString() })

interface PeriodsRequest {
    store: string | null
    showDeleted: string | null
}

// Serves the given periods, adding the deleted ones only when they're asked for, and records each request's settings
const servePeriods = (worker: SetupWorker, periods: PeriodType[]) => {
    const requests: PeriodsRequest[] = []
    worker.use(
        http.get(periodsApiUrl, ({ request }) => {
            const params = new URL(request.url).searchParams
            const showDeleted = params.get('showDeleted')
            requests.push({ store: params.get('store'), showDeleted })
            return HttpResponse.json(
                showDeleted === 'true' ? periods : periods.filter((period) => period.deletedAt === null)
            )
        })
    )
    return requests
}

// Opens the modal and waits for its list to load
const openPeriods = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: 'Periods' }))
    return await screen.findByRole('dialog', { name: 'Periods' })
}

describe('PeriodsModal', () => {
    test('should open a list of periods from the Periods button', async ({ worker }) => {
        servePeriods(worker, [blackFriday])
        const user = userEvent.setup()
        renderWithClient(<PeriodsModal />)

        const dialog = await openPeriods(user)

        expect(await within(dialog).findByText('Black Friday')).toBeInTheDocument()
    })

    test("should ask for every store's periods, without deleted ones", async ({ worker }) => {
        const requests = servePeriods(worker, [blackFriday])
        const user = userEvent.setup()
        renderWithClient(<PeriodsModal />)

        await openPeriods(user)

        await waitFor(() => expect(requests).toEqual([{ store: null, showDeleted: 'false' }]))
    })

    test('should show the store and type of each period', async ({ worker }) => {
        servePeriods(worker, [blackFriday, cardCashback])
        const user = userEvent.setup()
        renderWithClient(<PeriodsModal />)

        const dialog = await openPeriods(user)
        const blackFridayRow = await within(dialog).findByRole('listitem', { name: 'Black Friday' })
        const cardCashbackRow = within(dialog).getByRole('listitem', { name: 'Card cashback' })

        expect(within(blackFridayRow).getByText('Store 1')).toBeInTheDocument()
        expect(within(blackFridayRow).getByText('Sale')).toBeInTheDocument()
        expect(within(cardCashbackRow).getByText('All stores')).toBeInTheDocument()
        expect(within(cardCashbackRow).getByText('Return')).toBeInTheDocument()
    })

    test('should show the dates of each period', async ({ worker }) => {
        servePeriods(worker, [blackFriday])
        const user = userEvent.setup()
        renderWithClient(<PeriodsModal />)

        const dialog = await openPeriods(user)
        const row = await within(dialog).findByRole('listitem', { name: 'Black Friday' })

        expect(within(row).getByText('Nov 27, 2026 12:00 AM to Nov 30, 2026 11:59 PM')).toBeInTheDocument()
    })

    test('should keep the order the backend sends', async ({ worker }) => {
        servePeriods(worker, [cardCashback, blackFriday])
        const user = userEvent.setup()
        renderWithClient(<PeriodsModal />)

        const dialog = await openPeriods(user)
        await within(dialog).findByRole('listitem', { name: 'Black Friday' })

        const names = within(dialog)
            .getAllByRole('listitem')
            .map((row) => row.getAttribute('aria-label'))
        expect(names).toEqual(['Card cashback', 'Black Friday'])
    })

    test('should cut off long names, with the full name on hover', async ({ worker }) => {
        const longName = 'A very long period name that would push the store and type out of the row'
        servePeriods(worker, [createPeriod(4, { name: longName })])
        const user = userEvent.setup()
        renderWithClient(<PeriodsModal />)

        const dialog = await openPeriods(user)
        const name = await within(dialog).findByText(longName)

        expect(name).toHaveClass('truncate')
        expect(name).toHaveAttribute('title', longName)
    })

    test('should leave out deleted periods until Show deleted is switched on', async ({ worker }) => {
        const requests = servePeriods(worker, [blackFriday, deletedSale])
        const user = userEvent.setup()
        renderWithClient(<PeriodsModal />)

        const dialog = await openPeriods(user)
        await within(dialog).findByText('Black Friday')
        expect(within(dialog).queryByText('Old sale')).not.toBeInTheDocument()
        await user.click(within(dialog).getByRole('switch', { name: 'Show deleted' }))

        expect(await within(dialog).findByText('Old sale')).toBeInTheDocument()
        expect(requests.at(-1)).toEqual({ store: null, showDeleted: 'true' })
    })

    test('should strike through the names of deleted periods', async ({ worker }) => {
        servePeriods(worker, [blackFriday, deletedSale])
        const user = userEvent.setup()
        renderWithClient(<PeriodsModal />)

        const dialog = await openPeriods(user)
        await user.click(within(dialog).getByRole('switch', { name: 'Show deleted' }))

        expect(await within(dialog).findByText('Old sale')).toHaveClass('line-through')
        expect(within(dialog).getByText('Black Friday')).not.toHaveClass('line-through')
    })

    test('should explain when there are no periods yet', async ({ worker }) => {
        servePeriods(worker, [])
        const user = userEvent.setup()
        renderWithClient(<PeriodsModal />)

        const dialog = await openPeriods(user)

        expect(await within(dialog).findByText('No periods yet.')).toBeInTheDocument()
    })

    test('should not explain while there are periods', async ({ worker }) => {
        servePeriods(worker, [blackFriday])
        const user = userEvent.setup()
        renderWithClient(<PeriodsModal />)

        const dialog = await openPeriods(user)
        await within(dialog).findByText('Black Friday')

        expect(within(dialog).queryByText('No periods yet.')).not.toBeInTheDocument()
    })
})
