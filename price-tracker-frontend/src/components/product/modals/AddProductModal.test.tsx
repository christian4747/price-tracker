import { describe, expect, onTestFinished } from 'vitest'
import type { SetupWorker } from 'msw/browser'
import type { ProductDTO } from '@/types/product'
import { renderWithClient, screen, test, tryEveryModalCloseAction, userEvent, waitFor, within } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import AddProductModal from './AddProductModal'

const productsApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/products'

// Opens the modal and starts a save that stays in progress until finishSave is called
const startSave = async (worker: SetupWorker) => {
    let finishSave = () => {}
    const saveFinished = new Promise<void>((resolve) => (finishSave = resolve))
    // Tests that end mid-save still let the request finish
    onTestFinished(() => finishSave())
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

    return { finishSave, submitButton, user }
}

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

    test('should fill the brand from a recent brand button', async ({ worker }) => {
        let recentBrandsRequested = false
        worker.use(
            http.get(productsApiUrl + '/recent/brands', () => {
                recentBrandsRequested = true
                return HttpResponse.json(['Brand 2', 'Brand 1'])
            })
        )
        const user = userEvent.setup()
        renderWithClient(<AddProductModal />)

        // Recent brands are only fetched once the modal opens
        expect(recentBrandsRequested).toBe(false)
        await user.click(screen.getByRole('button', { name: 'Add Product' }))

        await user.click(await screen.findByRole('button', { name: 'Brand 2' }))

        expect((screen.getByRole('textbox', { name: 'Brand' }) as HTMLInputElement).value).toBe('Brand 2')
    })

    test('should send the brand', async ({ worker }) => {
        let sentProduct: ProductDTO | undefined
        worker.use(
            http.post(productsApiUrl, async ({ request }) => {
                sentProduct = (await request.json()) as ProductDTO
                return HttpResponse.json({ name: 'Product 1' })
            })
        )
        const user = userEvent.setup()
        renderWithClient(<AddProductModal />)

        await user.click(screen.getByRole('button', { name: 'Add Product' }))
        await user.type(screen.getByRole('textbox', { name: 'Brand' }), 'Brand 1')
        await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Add Product' }))

        await waitFor(() => expect(sentProduct?.brand).toBe('Brand 1'))
    })

    test('should show the save in progress', async ({ worker }) => {
        const { submitButton } = await startSave(worker)

        expect(submitButton).toHaveAttribute('data-loading')
    })

    test('should ignore closing while the save is in progress', async ({ worker }) => {
        const { user } = await startSave(worker)

        await tryEveryModalCloseAction(user)

        expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    test('should close once the save succeeds', async ({ worker }) => {
        const { finishSave } = await startSave(worker)

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
