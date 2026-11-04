import { describe, expect, onTestFinished, vi } from 'vitest'
import type { SetupWorker } from 'msw/browser'
import { createPeriod, renderWithClient, screen, test, userEvent, waitFor } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import { notifications } from '@mantine/notifications'
import dayjs from 'dayjs'
import type { PeriodDTO } from '@/types/period'
import { PeriodForm } from './PeriodForm'

const periodsApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/periods'
const productsApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/products'

// Records the body of each period the form saves, answering with the given status
const recordSavedPeriods = (worker: SetupWorker, status = 200) => {
    const savedPeriods: PeriodDTO[] = []
    worker.use(
        http.post(periodsApiUrl, async ({ request }) => {
            const body = (await request.json()) as PeriodDTO
            savedPeriods.push(body)
            if (status !== 200) return HttpResponse.text('A period with this name already exists!', { status })
            return HttpResponse.json(createPeriod(1, { ...body }))
        })
    )
    return savedPeriods
}

// Watches the notifications until the test ends, and returns the messages shown so far
const watchNotifications = () => {
    const show = vi.spyOn(notifications, 'show')
    onTestFinished(() => show.mockRestore())

    return () => show.mock.calls.map(([notification]) => notification.message)
}

const fillName = async (user: ReturnType<typeof userEvent.setup>, name = 'Black Friday') => {
    await user.type(screen.getByRole('textbox', { name: 'Name' }), name)
}

const fillStore = async (user: ReturnType<typeof userEvent.setup>, store = 'Store 1') => {
    await user.type(screen.getByRole('textbox', { name: 'Store' }), store)
}

const save = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: 'Save period' }))
}

describe('PeriodForm', () => {
    test('should save a sale period for the typed store, from now until the end of today', async ({ worker }) => {
        const savedPeriods = recordSavedPeriods(worker)
        const user = userEvent.setup()
        renderWithClient(<PeriodForm onSaved={() => {}} />)

        await fillName(user)
        await fillStore(user)
        const savedAfter = dayjs().second(0).millisecond(0)
        await save(user)

        await waitFor(() => expect(savedPeriods).toHaveLength(1))
        expect(savedPeriods[0]).toMatchObject({ name: 'Black Friday', type: 'SALE', store: 'Store 1' })
        // The start is the minute the form opened, and the end is the last minute of today
        expect(Math.abs(dayjs(savedPeriods[0].periodStarted).diff(savedAfter, 'minute'))).toBeLessThanOrEqual(1)
        expect(dayjs(savedPeriods[0].periodEnded).format()).toBe(dayjs().endOf('day').second(0).format())
    })

    test('should save a return period when Return is chosen', async ({ worker }) => {
        const savedPeriods = recordSavedPeriods(worker)
        const user = userEvent.setup()
        renderWithClient(<PeriodForm onSaved={() => {}} />)

        await fillName(user, 'Card cashback')
        await fillStore(user)
        await user.click(screen.getByRole('radio', { name: 'Return' }))
        await save(user)

        await waitFor(() => expect(savedPeriods).toHaveLength(1))
        expect(savedPeriods[0].type).toBe('RETURN')
    })

    test('should start as a sale', () => {
        renderWithClient(<PeriodForm onSaved={() => {}} />)

        expect(screen.getByRole('radio', { name: 'Sale' })).toBeChecked()
    })

    test('should save a period for all stores without asking for a store', async ({ worker }) => {
        const savedPeriods = recordSavedPeriods(worker)
        const user = userEvent.setup()
        renderWithClient(<PeriodForm onSaved={() => {}} />)

        await fillName(user)
        await user.click(screen.getByRole('switch', { name: 'All stores' }))
        expect(screen.queryByRole('textbox', { name: 'Store' })).not.toBeInTheDocument()
        await save(user)

        await waitFor(() => expect(savedPeriods).toHaveLength(1))
        expect(savedPeriods[0].store).toBeNull()
    })

    test('should bring back the typed store when All stores is switched off again', async () => {
        const user = userEvent.setup()
        renderWithClient(<PeriodForm onSaved={() => {}} />)

        await fillStore(user)
        const allStores = screen.getByRole('switch', { name: 'All stores' })
        await user.click(allStores)
        // A placeholder query, since the closing field is hidden from role queries as soon as it starts sliding closed
        await waitFor(() => expect(screen.queryByPlaceholderText('Store')).not.toBeInTheDocument())
        await user.click(allStores)

        expect(await screen.findByRole('textbox', { name: 'Store' })).toHaveValue('Store 1')
    })

    test('should fill the store from a recent store', async ({ worker }) => {
        worker.use(http.get(productsApiUrl + '/recent/stores', () => HttpResponse.json(['Store 7'])))
        const user = userEvent.setup()
        renderWithClient(<PeriodForm onSaved={() => {}} />)

        await user.click(await screen.findByRole('button', { name: 'Store 7' }))

        expect(screen.getByRole('textbox', { name: 'Store' })).toHaveValue('Store 7')
    })

    test('should not show messages before a save is tried', () => {
        renderWithClient(<PeriodForm onSaved={() => {}} />)

        expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
        expect(screen.queryByText('Store is required')).not.toBeInTheDocument()
    })

    test('should ask for a name and store instead of saving without them', async ({ worker }) => {
        const savedPeriods = recordSavedPeriods(worker)
        const user = userEvent.setup()
        renderWithClient(<PeriodForm onSaved={() => {}} />)

        await user.type(screen.getByRole('textbox', { name: 'Name' }), '   ')
        await save(user)

        expect(await screen.findByText('Name is required')).toBeInTheDocument()
        expect(screen.getByText('Store is required')).toBeInTheDocument()
        expect(savedPeriods).toHaveLength(0)
    })

    test('should not save without a name, even with a store', async ({ worker }) => {
        const savedPeriods = recordSavedPeriods(worker)
        const user = userEvent.setup()
        renderWithClient(<PeriodForm onSaved={() => {}} />)

        await fillStore(user)
        await save(user)

        expect(await screen.findByText('Name is required')).toBeInTheDocument()
        expect(savedPeriods).toHaveLength(0)
    })

    test('should not save without a store, even with a name', async ({ worker }) => {
        const savedPeriods = recordSavedPeriods(worker)
        const user = userEvent.setup()
        renderWithClient(<PeriodForm onSaved={() => {}} />)

        await fillName(user)
        await save(user)

        expect(await screen.findByText('Store is required')).toBeInTheDocument()
        expect(savedPeriods).toHaveLength(0)
    })

    test('should clear the messages once the name and store are typed', async () => {
        const user = userEvent.setup()
        renderWithClient(<PeriodForm onSaved={() => {}} />)

        await save(user)
        await screen.findByText('Name is required')
        await fillName(user, 'B')
        await fillStore(user, 'S')

        expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
        expect(screen.queryByText('Store is required')).not.toBeInTheDocument()
    })

    test('should not save while the end date is before the start', async () => {
        const user = userEvent.setup()
        renderWithClient(<PeriodForm onSaved={() => {}} />)

        // Moves the end to midnight this morning, before the start of now
        await user.click(screen.getByText(dayjs().endOf('day').format('MMM D, YYYY h:mm A')))
        await user.click(await screen.findByRole('button', { name: '00:00' }))

        expect(await screen.findByText('End date must be after the start date')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Save period' })).toBeDisabled()
    })

    test('should tell the form once the period is saved', async ({ worker }) => {
        recordSavedPeriods(worker)
        const onSaved = vi.fn()
        const user = userEvent.setup()
        renderWithClient(<PeriodForm onSaved={onSaved} />)

        await fillName(user)
        await fillStore(user)
        await save(user)

        await waitFor(() => expect(onSaved).toHaveBeenCalledOnce())
    })

    test('should keep its values when the save is rejected', async ({ worker }) => {
        const savedPeriods = recordSavedPeriods(worker, 400)
        const onSaved = vi.fn()
        const user = userEvent.setup()
        renderWithClient(<PeriodForm onSaved={onSaved} />)

        await fillName(user)
        await fillStore(user)
        await save(user)

        await waitFor(() => expect(savedPeriods).toHaveLength(1))
        await waitFor(() => expect(screen.getByRole('button', { name: 'Save period' })).toBeEnabled())
        expect(onSaved).not.toHaveBeenCalled()
        expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Black Friday')
    })

    test.for([
        ['Sale', 'Successfully added sale period Black Friday'],
        ['Return', 'Successfully added return period Black Friday']
    ])('should name the type when a %s period is saved', async ([type, message], { worker }) => {
        recordSavedPeriods(worker)
        const messages = watchNotifications()
        const user = userEvent.setup()
        renderWithClient(<PeriodForm onSaved={() => {}} />)

        await fillName(user)
        await fillStore(user)
        await user.click(screen.getByRole('radio', { name: type }))
        await save(user)

        await waitFor(() => expect(messages()).toContain(message))
    })
})

// Built from local times so the expected text doesn't depend on the test machine's time zone
const cardCashback = createPeriod(7, {
    name: 'Card cashback',
    type: 'RETURN',
    store: 'Store 2',
    periodStarted: new Date(2026, 11, 1, 0, 0).toISOString(),
    periodEnded: new Date(2026, 11, 31, 23, 59).toISOString()
})

// Records the ID and body of each edit the form saves
const recordEditedPeriods = (worker: SetupWorker) => {
    const edits: { periodId: string; body: PeriodDTO }[] = []
    worker.use(
        http.put(periodsApiUrl + '/:periodId', async ({ request, params }) => {
            const body = (await request.json()) as PeriodDTO
            edits.push({ periodId: params.periodId as string, body })
            return HttpResponse.json(createPeriod(Number(params.periodId), { ...body }))
        })
    )
    return edits
}

describe('PeriodForm when editing', () => {
    test("should start with the period's values", () => {
        renderWithClient(<PeriodForm period={cardCashback} onSaved={() => {}} />)

        expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Card cashback')
        expect(screen.getByRole('radio', { name: 'Return' })).toBeChecked()
        expect(screen.getByRole('switch', { name: 'All stores' })).not.toBeChecked()
        expect(screen.getByRole('textbox', { name: 'Store' })).toHaveValue('Store 2')
        expect(screen.getByText('Dec 1, 2026 12:00 AM')).toBeInTheDocument()
        expect(screen.getByText('Dec 31, 2026 11:59 PM')).toBeInTheDocument()
    })

    test('should start with All stores on for a period without a store', () => {
        renderWithClient(<PeriodForm period={{ ...cardCashback, store: null }} onSaved={() => {}} />)

        expect(screen.getByRole('switch', { name: 'All stores' })).toBeChecked()
        expect(screen.queryByRole('textbox', { name: 'Store' })).not.toBeInTheDocument()
    })

    test('should save the changes to the same period', async ({ worker }) => {
        const edits = recordEditedPeriods(worker)
        const onSaved = vi.fn()
        const user = userEvent.setup()
        renderWithClient(<PeriodForm period={cardCashback} onSaved={onSaved} />)

        await user.type(screen.getByRole('textbox', { name: 'Name' }), ' 2027')
        await user.click(screen.getByRole('button', { name: 'Save changes' }))

        await waitFor(() => expect(edits).toHaveLength(1))
        expect(edits[0].periodId).toBe('7')
        expect(edits[0].body).toMatchObject({ name: 'Card cashback 2027', type: 'RETURN', store: 'Store 2' })
        // Compared as times so time zone offsets don't matter
        expect(Date.parse(edits[0].body.periodStarted)).toBe(Date.parse(cardCashback.periodStarted))
        expect(Date.parse(edits[0].body.periodEnded)).toBe(Date.parse(cardCashback.periodEnded))
        await waitFor(() => expect(onSaved).toHaveBeenCalledOnce())
    })

    test('should not add a new period', async ({ worker }) => {
        recordEditedPeriods(worker)
        const savedPeriods = recordSavedPeriods(worker)
        const onSaved = vi.fn()
        const user = userEvent.setup()
        renderWithClient(<PeriodForm period={cardCashback} onSaved={onSaved} />)

        await user.click(screen.getByRole('button', { name: 'Save changes' }))

        await waitFor(() => expect(onSaved).toHaveBeenCalledOnce())
        expect(savedPeriods).toHaveLength(0)
    })

    test('should name the period once its changes are saved', async ({ worker }) => {
        recordEditedPeriods(worker)
        const messages = watchNotifications()
        const user = userEvent.setup()
        renderWithClient(<PeriodForm period={cardCashback} onSaved={() => {}} />)

        await user.click(screen.getByRole('button', { name: 'Save changes' }))

        await waitFor(() => expect(messages()).toContain('Successfully edited period Card cashback'))
    })
})
