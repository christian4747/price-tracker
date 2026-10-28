import { describe, expect } from 'vitest'
import { renderWithClient, screen, test, userEvent } from '@/test-utils'
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
})
