import { describe, expect, onTestFinished, vi } from 'vitest'
import type { SetupWorker } from 'msw/browser'
import {
    createPrice,
    getModalSize,
    problemDetailResponse,
    renderWithClient,
    screen,
    test,
    tryEveryModalCloseAction,
    userEvent,
    waitFor
} from '@/test-utils'
import { http, HttpResponse } from 'msw'
import { PermanentlyDeletePriceModal } from './PermanentlyDeletePriceModal'

const price = createPrice(1, {
    // Built from a local time so the expected text doesn't depend on the test machine's time zone
    priceStarted: new Date(2026, 8, 4, 12).toISOString(),
    deletedAt: new Date(2026, 8, 6, 12).toISOString()
})

const pricesApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/prices'

// Renders the modal and starts a delete that stays in progress until finishDelete is called
const startDelete = async (worker: SetupWorker) => {
    let finishDelete = () => {}
    const deleteFinished = new Promise<void>((resolve) => (finishDelete = resolve))
    // Tests that end mid-delete still let the request finish
    onTestFinished(() => finishDelete())
    worker.use(
        http.delete(pricesApiUrl + '/:priceId/permanent', async () => {
            await deleteFinished
            return HttpResponse.json(price)
        })
    )
    const closeModal = vi.fn()
    const user = userEvent.setup()
    renderWithClient(<PermanentlyDeletePriceModal price={price} closeModal={closeModal} opened />)

    const submitButton = screen.getByRole('button', { name: 'Permanently Delete Price' })
    await user.click(submitButton)
    await waitFor(() => expect(submitButton).toBeDisabled())

    return { closeModal, finishDelete, submitButton, user }
}

describe('Permanently Delete Price Modal Component', () => {
    test('should keep the default width, since it only holds a sentence and a button', async () => {
        renderWithClient(<PermanentlyDeletePriceModal price={price} closeModal={() => {}} opened />)

        expect(getModalSize(await screen.findByRole('dialog'))).toBe('md')
    })

    test('should say which price is being deleted and that it cannot be undone', async () => {
        renderWithClient(<PermanentlyDeletePriceModal price={price} closeModal={() => {}} opened />)

        await expect.element(screen.getByText(/permanently delete price 9\/4\/2026/i)).toBeInTheDocument()
        await expect.element(screen.getByText("This can't be undone.")).toBeInTheDocument()
    })

    test('should send the delete to the permanent endpoint for the price', async ({ worker }) => {
        const deletedPriceIds: string[] = []
        let softDeleteRequests = 0
        worker.use(
            http.delete(pricesApiUrl + '/:priceId/permanent', ({ params }) => {
                deletedPriceIds.push(params.priceId as string)
                return HttpResponse.json(price)
            }),
            http.delete(pricesApiUrl + '/:priceId', () => {
                softDeleteRequests++
                return HttpResponse.json(price)
            })
        )
        const user = userEvent.setup()
        renderWithClient(<PermanentlyDeletePriceModal price={price} closeModal={() => {}} opened />)

        await user.click(screen.getByRole('button', { name: 'Permanently Delete Price' }))

        await waitFor(() => expect(deletedPriceIds).toEqual(['1']))
        expect(softDeleteRequests).toBe(0)
    })

    test('should show the delete in progress', async ({ worker }) => {
        const { submitButton } = await startDelete(worker)

        expect(submitButton).toHaveAttribute('data-loading')
    })

    test('should ignore closing while the delete is in progress', async ({ worker }) => {
        const { closeModal, user } = await startDelete(worker)

        await tryEveryModalCloseAction(user)

        expect(closeModal).not.toHaveBeenCalled()
    })

    test('should close once the delete succeeds', async ({ worker }) => {
        const { closeModal, finishDelete } = await startDelete(worker)

        finishDelete()

        await waitFor(() => expect(closeModal).toHaveBeenCalledOnce())
    })

    test('should stay open when the delete is rejected', async ({ worker }) => {
        let deleteRejected = false
        worker.use(
            http.delete(pricesApiUrl + '/:priceId/permanent', () => {
                deleteRejected = true
                return problemDetailResponse(409, 'Only deleted prices can be permanently deleted!')
            })
        )
        const closeModal = vi.fn()
        const user = userEvent.setup()
        renderWithClient(<PermanentlyDeletePriceModal price={price} closeModal={closeModal} opened />)

        const submitButton = screen.getByRole('button', { name: 'Permanently Delete Price' })
        await user.click(submitButton)

        await waitFor(() => expect(deleteRejected).toBe(true))
        await waitFor(() => expect(submitButton).toBeEnabled())
        expect(closeModal).not.toHaveBeenCalled()
    })
})
