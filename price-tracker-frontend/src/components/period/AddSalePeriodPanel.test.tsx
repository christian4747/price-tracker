import { describe, expect } from 'vitest'
import type { SetupWorker } from 'msw/browser'
import { problemDetailResponse, renderWithClient, screen, test, userEvent, waitFor } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import type { PeriodDTO } from '@/types/period'
import { AddSalePeriodPanel } from './AddSalePeriodPanel'

const periodsApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/periods'

const toggleName = 'Save these dates as a sale period'

// Built from local times so they don't depend on the test machine's time zone
const periodStarted = new Date(2026, 10, 27, 0, 0).toISOString()
const periodEnded = new Date(2026, 10, 30, 23, 59).toISOString()

// Records the body of each period the panel saves, answering with the given status
const recordSavedPeriods = (worker: SetupWorker, status = 200) => {
    const savedPeriods: PeriodDTO[] = []
    worker.use(
        http.post(periodsApiUrl, async ({ request }) => {
            const body = (await request.json()) as PeriodDTO
            savedPeriods.push(body)
            if (status !== 200) return problemDetailResponse(status, 'A period with this name already exists!')
            return HttpResponse.json({ periodId: 1, ...body })
        })
    )
    return savedPeriods
}

const renderPanel = (datesInvalid = false) =>
    renderWithClient(
        <AddSalePeriodPanel
            store="Store 1"
            periodStarted={periodStarted}
            periodEnded={periodEnded}
            datesInvalid={datesInvalid}
        />
    )

// Opens the panel and waits for it to slide open, since its inputs only appear once the slide starts
const openPanel = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: toggleName }))
    await screen.findByRole('textbox', { name: 'Sale period name' })
}

// Closes the panel and waits for it to finish sliding closed. A placeholder query, since the closing panel is hidden
// from role queries as soon as the slide starts
const closePanel = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: toggleName }))
    await waitFor(() => expect(screen.queryByPlaceholderText('ex. Black Friday')).not.toBeInTheDocument())
}

describe('AddSalePeriodPanel', () => {
    test('should hide the name until the panel is opened', async () => {
        const user = userEvent.setup()
        renderPanel()

        expect(screen.queryByRole('textbox', { name: 'Sale period name' })).not.toBeInTheDocument()
        await openPanel(user)

        expect(screen.getByRole('textbox', { name: 'Sale period name' })).toBeInTheDocument()
    })

    test("should save a sale period for the product's store with both dates", async ({ worker }) => {
        const savedPeriods = recordSavedPeriods(worker)
        const user = userEvent.setup()
        renderPanel()

        await openPanel(user)
        await user.type(screen.getByRole('textbox', { name: 'Sale period name' }), 'Black Friday')
        await user.click(screen.getByRole('button', { name: 'Save sale period' }))

        await waitFor(() => expect(savedPeriods).toHaveLength(1))
        expect(savedPeriods[0]).toMatchObject({ name: 'Black Friday', type: 'SALE', store: 'Store 1' })
        // Compared as times so time zone offsets don't matter
        expect(Date.parse(savedPeriods[0].periodStarted)).toBe(Date.parse(periodStarted))
        expect(Date.parse(savedPeriods[0].periodEnded)).toBe(Date.parse(periodEnded))
    })

    test('should save a sale period for all stores when switched on', async ({ worker }) => {
        const savedPeriods = recordSavedPeriods(worker)
        const user = userEvent.setup()
        renderPanel()

        await openPanel(user)
        await user.type(screen.getByRole('textbox', { name: 'Sale period name' }), 'Black Friday')
        await user.click(screen.getByRole('switch', { name: 'All stores' }))
        await user.click(screen.getByRole('button', { name: 'Save sale period' }))

        await waitFor(() => expect(savedPeriods).toHaveLength(1))
        expect(savedPeriods[0].store).toBeNull()
    })

    test('should say which stores the sale period is for', async () => {
        const user = userEvent.setup()
        renderPanel()

        await openPanel(user)
        const allStoresSwitch = screen.getByRole('switch', { name: 'All stores' })
        expect(allStoresSwitch).toHaveAccessibleDescription('Only for Store 1')
        await user.click(allStoresSwitch)

        expect(allStoresSwitch).toHaveAccessibleDescription('For every store')
    })

    test('should not show the name message before a save is tried', async () => {
        const user = userEvent.setup()
        renderPanel()

        await openPanel(user)

        expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
    })

    test('should ask for a name instead of saving without one', async ({ worker }) => {
        const savedPeriods = recordSavedPeriods(worker)
        const user = userEvent.setup()
        renderPanel()

        await openPanel(user)
        await user.type(screen.getByRole('textbox', { name: 'Sale period name' }), '   ')
        await user.click(screen.getByRole('button', { name: 'Save sale period' }))

        expect(await screen.findByText('Name is required')).toBeInTheDocument()
        expect(savedPeriods).toHaveLength(0)
    })

    test('should clear the name message once a name is typed', async () => {
        const user = userEvent.setup()
        renderPanel()

        await openPanel(user)
        await user.click(screen.getByRole('button', { name: 'Save sale period' }))
        await screen.findByText('Name is required')
        await user.type(screen.getByRole('textbox', { name: 'Sale period name' }), 'B')

        expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
    })

    test('should not show the name message again after reopening', async () => {
        const user = userEvent.setup()
        renderPanel()

        await openPanel(user)
        await user.click(screen.getByRole('button', { name: 'Save sale period' }))
        await screen.findByText('Name is required')
        await closePanel(user)
        await openPanel(user)

        expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
    })

    test('should not save while the dates are invalid', async () => {
        const user = userEvent.setup()
        renderPanel(true)

        await openPanel(user)

        expect(screen.getByRole('button', { name: 'Save sale period' })).toBeDisabled()
    })

    test('should close and start over after saving', async ({ worker }) => {
        recordSavedPeriods(worker)
        const user = userEvent.setup()
        renderPanel()

        await openPanel(user)
        await user.type(screen.getByRole('textbox', { name: 'Sale period name' }), 'Black Friday')
        await user.click(screen.getByRole('switch', { name: 'All stores' }))
        await user.click(screen.getByRole('button', { name: 'Save sale period' }))

        await waitFor(() => expect(screen.queryByPlaceholderText('ex. Black Friday')).not.toBeInTheDocument())
        await openPanel(user)
        expect((screen.getByRole('textbox', { name: 'Sale period name' }) as HTMLInputElement).value).toBe('')
        expect(screen.getByRole('switch', { name: 'All stores' })).not.toBeChecked()
    })

    test('should stay open with its values when the save is rejected', async ({ worker }) => {
        const savedPeriods = recordSavedPeriods(worker, 409)
        const user = userEvent.setup()
        renderPanel()

        await openPanel(user)
        await user.type(screen.getByRole('textbox', { name: 'Sale period name' }), 'Black Friday')
        const saveButton = screen.getByRole('button', { name: 'Save sale period' })
        await user.click(saveButton)

        await waitFor(() => expect(savedPeriods).toHaveLength(1))
        await waitFor(() => expect(saveButton).toBeEnabled())
        expect((screen.getByRole('textbox', { name: 'Sale period name' }) as HTMLInputElement).value).toBe(
            'Black Friday'
        )
    })
})
