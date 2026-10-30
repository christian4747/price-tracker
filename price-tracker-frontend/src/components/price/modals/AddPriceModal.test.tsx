import { describe, expect, onTestFinished } from 'vitest'
import type { SetupWorker } from 'msw/browser'
import {
    modalCloseActions,
    renderWithClient,
    screen,
    test,
    tryEveryModalCloseAction,
    userEvent,
    waitFor,
    within
} from '@/test-utils'
import { http, HttpResponse } from 'msw'
import { AddPriceModal } from './AddPriceModal'
import type { ProductType } from '@/types/product'

const product: ProductType = {
    active: true,
    productId: 1,
    name: 'Product 1',
    link: '',
    store: 'Store 1',
    createdAt: '',
    updatedAt: '',
    prices: [],
    deletedAt: null
}

const pricesApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/prices'

const savedPrice = { priceStarted: '2026-09-04T00:00:00.000Z' }

// Opens the modal and picks which dates to save, ready for the save to be submitted
const openWithDates = async (dateButton: string) => {
    const user = userEvent.setup()
    renderWithClient(<AddPriceModal product={product} setDateToday={() => {}} />)

    await user.click(screen.getByRole('button', { name: 'Add Price' }))
    const dialog = within(screen.getByRole('dialog'))
    await user.click(dialog.getByRole('button', { name: dateButton }))

    return { submitButton: dialog.getByRole('button', { name: 'Add Price' }), user }
}

// Starts a save that stays in progress until the test ends
const startSave = async (worker: SetupWorker, dateButton: string) => {
    let finishSave = () => {}
    const saveFinished = new Promise<void>((resolve) => (finishSave = resolve))
    // Tests that end mid-save still let the request finish
    onTestFinished(() => finishSave())
    worker.use(
        http.post(pricesApiUrl, async () => {
            await saveFinished
            return HttpResponse.json(savedPrice)
        }),
        http.post(pricesApiUrl + '/range', async () => {
            await saveFinished
            return HttpResponse.json([savedPrice, savedPrice])
        })
    )
    const { submitButton, user } = await openWithDates(dateButton)

    await user.click(submitButton)
    await waitFor(() => expect(submitButton).toBeDisabled())

    return { user }
}

describe('Add Price Modal Component', () => {
    test.for(['Start Date Only', 'Start and End Date'])(
        'should ignore closing while saving with %s',
        async (dateButton, { worker }) => {
            const { user } = await startSave(worker, dateButton)

            await tryEveryModalCloseAction(user)

            expect(screen.getByRole('dialog')).toBeInTheDocument()
        }
    )

    test('should close after the save is rejected', async ({ worker }) => {
        let saveRejected = false
        worker.use(
            http.post(pricesApiUrl, () => {
                saveRejected = true
                return HttpResponse.text('Price is invalid', { status: 400 })
            })
        )
        const { submitButton, user } = await openWithDates('Start Date Only')

        await user.click(submitButton)
        await waitFor(() => expect(saveRejected).toBe(true))
        await waitFor(() => expect(submitButton).toBeEnabled())

        await modalCloseActions.closeButton(user)

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })
})
