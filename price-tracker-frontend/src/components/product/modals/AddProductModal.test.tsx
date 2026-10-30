import { describe, expect } from 'vitest'
import { renderWithClient, screen, test, userEvent, waitFor, within } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import AddProductModal from './AddProductModal'

const productsApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/products'

describe('Add Product Modal Component', () => {
    test('should fill the store from a recent store button', async ({ worker }) => {
        let recentStoresRequested = false
        worker.use(
            http.get(productsApiUrl + '/recent/stores', () => {
                recentStoresRequested = true
                return HttpResponse.json(['Store 2', 'Store 1'])
            })
        )
        const user = userEvent.setup()
        renderWithClient(<AddProductModal />)

        // Recent stores are only fetched once the modal opens
        expect(recentStoresRequested).toBe(false)
        await user.click(screen.getByRole('button', { name: 'Add Product' }))

        await user.click(await screen.findByRole('button', { name: 'Store 2' }))

        expect((screen.getByRole('textbox', { name: 'Store' }) as HTMLInputElement).value).toBe('Store 2')
    })

    test('should show the save in progress and close once it succeeds', async ({ worker }) => {
        let finishSave = () => {}
        const saveFinished = new Promise<void>((resolve) => (finishSave = resolve))
        worker.use(
            http.post(productsApiUrl, async () => {
                await saveFinished
                return HttpResponse.json({ name: 'Product 1' })
            })
        )
        const user = userEvent.setup()
        renderWithClient(<AddProductModal />)

        await user.click(screen.getByRole('button', { name: 'Add Product' }))
        const submitButton = within(screen.getByRole('dialog')).getByRole('button', { name: 'Add Product' })
        await user.click(submitButton)

        await waitFor(() => expect(submitButton).toBeDisabled())
        expect(screen.getByRole('dialog')).toBeInTheDocument()

        finishSave()

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })

    test('should stay open with its values when the save is rejected', async ({ worker }) => {
        let saveRejected = false
        worker.use(
            http.post(productsApiUrl, () => {
                saveRejected = true
                return HttpResponse.text('Product already exists!', { status: 400 })
            })
        )
        const user = userEvent.setup()
        renderWithClient(<AddProductModal />)

        await user.click(screen.getByRole('button', { name: 'Add Product' }))
        await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Product 1')
        const submitButton = within(screen.getByRole('dialog')).getByRole('button', { name: 'Add Product' })
        await user.click(submitButton)

        await waitFor(() => expect(saveRejected).toBe(true))
        await waitFor(() => expect(submitButton).toBeEnabled())
        expect((screen.getByRole('textbox', { name: 'Name' }) as HTMLInputElement).value).toBe('Product 1')
    })
})
