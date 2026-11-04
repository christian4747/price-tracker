import { describe, expect, onTestFinished, vi } from 'vitest'
import type { SetupWorker } from 'msw/browser'
import { createPeriod, renderWithClient, screen, test, userEvent, waitFor, within } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import { notifications } from '@mantine/notifications'
import type { PeriodType } from '@/types/period'
import { PeriodRow } from './PeriodRow'

const periodsApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/periods'

const blackFriday = createPeriod(1, { name: 'Black Friday', store: 'Store 1' })
const oldSale = createPeriod(3, { name: 'Old sale', deletedAt: new Date(2026, 9, 1, 12).toISOString() })

const deleteText = 'Delete Black Friday? You can restore it with Show deleted.'
const permanentText = "Permanently delete Old sale? This can't be undone."

interface PeriodRequest {
    method: string
    path: string
}

// Records each change request sent for a period, answering with the period as the backend would
const recordRequests = (worker: SetupWorker) => {
    const requests: PeriodRequest[] = []
    const respond =
        (period: PeriodType) =>
        async ({ request }: { request: Request }) => {
            requests.push({ method: request.method, path: new URL(request.url).pathname.replace(/^.*\/periods/, '') })
            return HttpResponse.json(period)
        }
    worker.use(
        http.put(periodsApiUrl + '/:periodId', respond(blackFriday)),
        http.delete(periodsApiUrl + '/:periodId', respond({ ...blackFriday, deletedAt: new Date().toISOString() })),
        http.put(periodsApiUrl + '/:periodId/restore', respond({ ...oldSale, deletedAt: null })),
        http.delete(periodsApiUrl + '/:periodId/permanent', respond(oldSale))
    )
    return requests
}

// Watches the notifications until the test ends, and returns the messages shown so far
const watchNotifications = () => {
    const show = vi.spyOn(notifications, 'show')
    onTestFinished(() => show.mockRestore())

    return () => show.mock.calls.map(([notification]) => notification.message)
}

const renderRow = (period: PeriodType) =>
    renderWithClient(
        <ul>
            <PeriodRow period={period} />
        </ul>
    )

describe('PeriodRow', () => {
    test('should offer editing and deleting a period that is not deleted', () => {
        renderRow(blackFriday)

        expect(screen.getByRole('button', { name: 'Edit period' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Delete period' })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Restore period' })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Permanently delete period' })).not.toBeInTheDocument()
    })

    test('should offer editing, restoring, and permanently deleting a deleted period', () => {
        renderRow(oldSale)

        expect(screen.getByRole('button', { name: 'Edit period' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Restore period' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Permanently delete period' })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Delete period' })).not.toBeInTheDocument()
    })

    test("should open the period's form in the row from Edit", async () => {
        const user = userEvent.setup()
        renderRow(blackFriday)

        const edit = screen.getByRole('button', { name: 'Edit period' })
        expect(edit).toHaveAttribute('aria-expanded', 'false')
        await user.click(edit)

        expect(await screen.findByRole('textbox', { name: 'Name' })).toHaveValue('Black Friday')
        expect(edit).toHaveAttribute('aria-expanded', 'true')
    })

    test('should close the form once the changes are saved', async ({ worker }) => {
        const requests = recordRequests(worker)
        const user = userEvent.setup()
        renderRow(blackFriday)

        await user.click(screen.getByRole('button', { name: 'Edit period' }))
        await user.click(await screen.findByRole('button', { name: 'Save changes' }))

        await waitFor(() => expect(requests).toEqual([{ method: 'PUT', path: '/1' }]))
        // A placeholder query, since the closing form is hidden from role queries as soon as it starts sliding closed
        await waitFor(() => expect(screen.queryByPlaceholderText('ex. Black Friday')).not.toBeInTheDocument())
    })

    test('should ask before deleting, without deleting yet', async ({ worker }) => {
        const requests = recordRequests(worker)
        const user = userEvent.setup()
        renderRow(blackFriday)

        await user.click(screen.getByRole('button', { name: 'Delete period' }))

        expect(await screen.findByText(deleteText)).toBeInTheDocument()
        expect(requests).toHaveLength(0)
    })

    test('should delete the period once confirmed', async ({ worker }) => {
        const requests = recordRequests(worker)
        const messages = watchNotifications()
        const user = userEvent.setup()
        renderRow(blackFriday)

        await user.click(screen.getByRole('button', { name: 'Delete period' }))
        await user.click(await screen.findByRole('button', { name: 'Delete' }))

        await waitFor(() => expect(requests).toEqual([{ method: 'DELETE', path: '/1' }]))
        await waitFor(() => expect(messages()).toContain('Successfully deleted period Black Friday'))
    })

    test('should not delete the period when cancelled', async ({ worker }) => {
        const requests = recordRequests(worker)
        const user = userEvent.setup()
        renderRow(blackFriday)

        await user.click(screen.getByRole('button', { name: 'Delete period' }))
        await screen.findByText(deleteText)
        await user.click(screen.getByRole('button', { name: 'Cancel' }))

        await waitFor(() => expect(screen.queryByText(deleteText)).not.toBeInTheDocument())
        expect(requests).toHaveLength(0)
    })

    test('should restore a deleted period straight away', async ({ worker }) => {
        const requests = recordRequests(worker)
        const messages = watchNotifications()
        const user = userEvent.setup()
        renderRow(oldSale)

        await user.click(screen.getByRole('button', { name: 'Restore period' }))

        await waitFor(() => expect(requests).toEqual([{ method: 'PUT', path: '/3/restore' }]))
        await waitFor(() => expect(messages()).toContain('Successfully restored period Old sale'))
    })

    test('should ask before permanently deleting, and only delete once confirmed', async ({ worker }) => {
        const requests = recordRequests(worker)
        const messages = watchNotifications()
        const user = userEvent.setup()
        renderRow(oldSale)

        await user.click(screen.getByRole('button', { name: 'Permanently delete period' }))
        expect(await screen.findByText(permanentText)).toBeInTheDocument()
        expect(requests).toHaveLength(0)
        await user.click(screen.getByRole('button', { name: 'Permanently delete' }))

        await waitFor(() => expect(requests).toEqual([{ method: 'DELETE', path: '/3/permanent' }]))
        await waitFor(() => expect(messages()).toContain('Successfully permanently deleted period Old sale'))
    })

    test('should not permanently delete the period when cancelled', async ({ worker }) => {
        const requests = recordRequests(worker)
        const user = userEvent.setup()
        renderRow(oldSale)

        await user.click(screen.getByRole('button', { name: 'Permanently delete period' }))
        await screen.findByText(permanentText)
        await user.click(screen.getByRole('button', { name: 'Cancel' }))

        await waitFor(() => expect(screen.queryByText(permanentText)).not.toBeInTheDocument())
        expect(requests).toHaveLength(0)
    })

    test('should show one panel at a time, so Delete replaces the edit form', async () => {
        const user = userEvent.setup()
        renderRow(blackFriday)

        await user.click(screen.getByRole('button', { name: 'Edit period' }))
        await screen.findByRole('textbox', { name: 'Name' })
        await user.click(screen.getByRole('button', { name: 'Delete period' }))

        expect(await screen.findByText(deleteText)).toBeInTheDocument()
        // A placeholder query, since the closing form is hidden from role queries as soon as it starts sliding closed
        await waitFor(() => expect(screen.queryByPlaceholderText('ex. Black Friday')).not.toBeInTheDocument())
    })

    test('should keep the name and details in the row while a panel is open', async () => {
        const user = userEvent.setup()
        renderRow(blackFriday)

        await user.click(screen.getByRole('button', { name: 'Delete period' }))
        await screen.findByText(deleteText)

        const row = screen.getByRole('listitem', { name: 'Black Friday' })
        expect(within(row).getByText('Store 1')).toBeInTheDocument()
    })
})
