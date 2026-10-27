import { describe, expect } from 'vitest'
import { renderWithClient, screen, test, userEvent } from '@/test-utils'
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
})
