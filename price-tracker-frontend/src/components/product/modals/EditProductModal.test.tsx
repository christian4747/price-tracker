import { describe, expect, onTestFinished, vi } from 'vitest'
import type { SetupWorker } from 'msw/browser'
import {
    modalCloseActions,
    renderWithClient,
    screen,
    test,
    tryEveryModalCloseAction,
    userEvent,
    waitFor
} from '@/test-utils'
import { http, HttpResponse } from 'msw'
import { EditProductModal } from './EditProductModal'
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

const productsApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/products'

// Renders the modal and starts a save that stays in progress until finishSave is called
const startSave = async (worker: SetupWorker) => {
    let finishSave = () => {}
    const saveFinished = new Promise<void>((resolve) => (finishSave = resolve))
    // Tests that end mid-save still let the request finish
    onTestFinished(() => finishSave())
    worker.use(
        http.put(productsApiUrl + '/:productId', async () => {
            await saveFinished
            return HttpResponse.json(product)
        })
    )
    const closeEditProduct = vi.fn()
    const user = userEvent.setup()
    renderWithClient(<EditProductModal product={product} closeEditProduct={closeEditProduct} opened />)

    const submitButton = screen.getByRole('button', { name: 'Edit Product' })
    await user.click(submitButton)
    await waitFor(() => expect(submitButton).toBeDisabled())

    return { closeEditProduct, finishSave, submitButton, user }
}

describe('Edit Product Modal Component', () => {
    test('should show when the product was added and last updated', async () => {
        // Built from local times so the expected text doesn't depend on the test machine's time zone
        const datedProduct = {
            ...product,
            createdAt: new Date(2026, 7, 31, 14, 5).toISOString(),
            updatedAt: new Date(2026, 9, 28, 9, 30).toISOString()
        }
        renderWithClient(<EditProductModal product={datedProduct} closeEditProduct={() => {}} opened />)

        await expect.element(await screen.findByText('Added Aug 31, 2026 2:05 PM')).toBeVisible()
        await expect.element(screen.getByText('Last updated Oct 28, 2026 9:30 AM')).toBeVisible()
        // The dates stay out of the title so the header's close button keeps its place
        await expect.element(screen.getByRole('heading', { name: 'Edit Product' })).toBeInTheDocument()
    })

    test('should not fetch recent stores while closed', async () => {
        // Check the query itself rather than the network, so requests from other tests can't affect it
        const { queryClient } = renderWithClient(
            <EditProductModal product={product} closeEditProduct={() => {}} opened={false} />
        )

        // An enabled query starts fetching as soon as it mounts, so a closed modal's query should stay idle
        const recentStoresState = queryClient.getQueryState(['recentStores'])
        expect(recentStoresState?.fetchStatus).toBe('idle')
        expect(recentStoresState?.dataUpdateCount).toBe(0)
    })

    test('should change the store from a recent store button', async ({ worker }) => {
        worker.use(http.get(productsApiUrl + '/recent/stores', () => HttpResponse.json(['Store 2', 'Store 1'])))
        const user = userEvent.setup()
        renderWithClient(<EditProductModal product={product} closeEditProduct={() => {}} opened />)

        const storeInput = screen.getByRole('textbox', { name: 'Store' }) as HTMLInputElement
        expect(storeInput.value).toBe('Store 1')

        await user.click(await screen.findByRole('button', { name: 'Store 2' }))

        expect(storeInput.value).toBe('Store 2')
    })

    test('should show the save in progress', async ({ worker }) => {
        const { submitButton } = await startSave(worker)

        expect(submitButton).toHaveAttribute('data-loading')
    })

    test('should ignore closing while the save is in progress', async ({ worker }) => {
        const { closeEditProduct, user } = await startSave(worker)

        await tryEveryModalCloseAction(user)

        expect(closeEditProduct).not.toHaveBeenCalled()
    })

    test('should close once the save succeeds', async ({ worker }) => {
        const { closeEditProduct, finishSave } = await startSave(worker)

        finishSave()

        await waitFor(() => expect(closeEditProduct).toHaveBeenCalledOnce())
    })

    test.for(Object.keys(modalCloseActions) as (keyof typeof modalCloseActions)[])(
        'should close with %s after the save is rejected',
        async (closeAction, { worker }) => {
            let saveRejected = false
            worker.use(
                http.put(productsApiUrl + '/:productId', () => {
                    saveRejected = true
                    return HttpResponse.text('Product already exists!', { status: 400 })
                })
            )
            const closeEditProduct = vi.fn()
            const user = userEvent.setup()
            renderWithClient(<EditProductModal product={product} closeEditProduct={closeEditProduct} opened />)

            await user.click(screen.getByRole('button', { name: 'Edit Product' }))
            await waitFor(() => expect(saveRejected).toBe(true))
            await waitFor(() => expect(screen.getByRole('button', { name: 'Edit Product' })).toBeEnabled())

            await modalCloseActions[closeAction](user)

            expect(closeEditProduct).toHaveBeenCalledOnce()
        }
    )

    test('should stay open with its values when the save is rejected', async ({ worker }) => {
        let saveRejected = false
        worker.use(
            http.put(productsApiUrl + '/:productId', () => {
                saveRejected = true
                return HttpResponse.text('Product already exists!', { status: 400 })
            })
        )
        const closeEditProduct = vi.fn()
        const user = userEvent.setup()
        renderWithClient(<EditProductModal product={product} closeEditProduct={closeEditProduct} opened />)

        await user.type(screen.getByRole('textbox', { name: 'Name' }), ' changed')
        const submitButton = screen.getByRole('button', { name: 'Edit Product' })
        await user.click(submitButton)

        await waitFor(() => expect(saveRejected).toBe(true))
        await waitFor(() => expect(submitButton).toBeEnabled())
        expect(closeEditProduct).not.toHaveBeenCalled()
        expect((screen.getByRole('textbox', { name: 'Name' }) as HTMLInputElement).value).toBe('Product 1 changed')
    })
})
