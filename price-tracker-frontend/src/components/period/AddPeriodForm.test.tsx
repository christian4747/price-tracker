import { describe, expect, onTestFinished, vi } from 'vitest'
import type { SetupWorker } from 'msw/browser'
import { createPeriod, renderWithClient, screen, test, userEvent, waitFor } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import { notifications } from '@mantine/notifications'
import dayjs from 'dayjs'
import type { PeriodDTO } from '@/types/period'
import { AddPeriodForm } from './AddPeriodForm'

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

describe('AddPeriodForm', () => {
    test('should save a sale period for the typed store, from now until the end of today', async ({ worker }) => {
        const savedPeriods = recordSavedPeriods(worker)
        const user = userEvent.setup()
        renderWithClient(<AddPeriodForm onSaved={() => {}} />)

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
        renderWithClient(<AddPeriodForm onSaved={() => {}} />)

        await fillName(user, 'Card cashback')
        await fillStore(user)
        await user.click(screen.getByRole('radio', { name: 'Return' }))
        await save(user)

        await waitFor(() => expect(savedPeriods).toHaveLength(1))
        expect(savedPeriods[0].type).toBe('RETURN')
    })

    test('should start as a sale', () => {
        renderWithClient(<AddPeriodForm onSaved={() => {}} />)

        expect(screen.getByRole('radio', { name: 'Sale' })).toBeChecked()
    })

    test('should save a period for all stores without asking for a store', async ({ worker }) => {
        const savedPeriods = recordSavedPeriods(worker)
        const user = userEvent.setup()
        renderWithClient(<AddPeriodForm onSaved={() => {}} />)

        await fillName(user)
        await user.click(screen.getByRole('switch', { name: 'All stores' }))
        expect(screen.queryByRole('textbox', { name: 'Store' })).not.toBeInTheDocument()
        await save(user)

        await waitFor(() => expect(savedPeriods).toHaveLength(1))
        expect(savedPeriods[0].store).toBeNull()
    })

    test('should bring back the typed store when All stores is switched off again', async () => {
        const user = userEvent.setup()
        renderWithClient(<AddPeriodForm onSaved={() => {}} />)

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
        renderWithClient(<AddPeriodForm onSaved={() => {}} />)

        await user.click(await screen.findByRole('button', { name: 'Store 7' }))

        expect(screen.getByRole('textbox', { name: 'Store' })).toHaveValue('Store 7')
    })

    test('should not show messages before a save is tried', () => {
        renderWithClient(<AddPeriodForm onSaved={() => {}} />)

        expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
        expect(screen.queryByText('Store is required')).not.toBeInTheDocument()
    })

    test('should ask for a name and store instead of saving without them', async ({ worker }) => {
        const savedPeriods = recordSavedPeriods(worker)
        const user = userEvent.setup()
        renderWithClient(<AddPeriodForm onSaved={() => {}} />)

        await user.type(screen.getByRole('textbox', { name: 'Name' }), '   ')
        await save(user)

        expect(await screen.findByText('Name is required')).toBeInTheDocument()
        expect(screen.getByText('Store is required')).toBeInTheDocument()
        expect(savedPeriods).toHaveLength(0)
    })

    test('should not save without a name, even with a store', async ({ worker }) => {
        const savedPeriods = recordSavedPeriods(worker)
        const user = userEvent.setup()
        renderWithClient(<AddPeriodForm onSaved={() => {}} />)

        await fillStore(user)
        await save(user)

        expect(await screen.findByText('Name is required')).toBeInTheDocument()
        expect(savedPeriods).toHaveLength(0)
    })

    test('should not save without a store, even with a name', async ({ worker }) => {
        const savedPeriods = recordSavedPeriods(worker)
        const user = userEvent.setup()
        renderWithClient(<AddPeriodForm onSaved={() => {}} />)

        await fillName(user)
        await save(user)

        expect(await screen.findByText('Store is required')).toBeInTheDocument()
        expect(savedPeriods).toHaveLength(0)
    })

    test('should clear the messages once the name and store are typed', async () => {
        const user = userEvent.setup()
        renderWithClient(<AddPeriodForm onSaved={() => {}} />)

        await save(user)
        await screen.findByText('Name is required')
        await fillName(user, 'B')
        await fillStore(user, 'S')

        expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
        expect(screen.queryByText('Store is required')).not.toBeInTheDocument()
    })

    test('should not save while the end date is before the start', async () => {
        const user = userEvent.setup()
        renderWithClient(<AddPeriodForm onSaved={() => {}} />)

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
        renderWithClient(<AddPeriodForm onSaved={onSaved} />)

        await fillName(user)
        await fillStore(user)
        await save(user)

        await waitFor(() => expect(onSaved).toHaveBeenCalledOnce())
    })

    test('should keep its values when the save is rejected', async ({ worker }) => {
        const savedPeriods = recordSavedPeriods(worker, 400)
        const onSaved = vi.fn()
        const user = userEvent.setup()
        renderWithClient(<AddPeriodForm onSaved={onSaved} />)

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
        renderWithClient(<AddPeriodForm onSaved={() => {}} />)

        await fillName(user)
        await fillStore(user)
        await user.click(screen.getByRole('radio', { name: type }))
        await save(user)

        await waitFor(() => expect(messages()).toContain(message))
    })
})
