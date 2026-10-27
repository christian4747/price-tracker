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
    test('should not fetch recent stores while closed', async ({ worker }) => {
        let recentStoresRequested = false
        worker.use(
            http.get(productsApiUrl + '/recent/stores', () => {
                recentStoresRequested = true
                return HttpResponse.json(['Store 2'])
            })
        )
        renderWithClient(<EditProductModal product={product} closeEditProduct={() => {}} opened={false} />)

        // Give a request a chance to go out before checking it didn't
        await new Promise((resolve) => setTimeout(resolve, 100))
        expect(recentStoresRequested).toBe(false)
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
