import { describe, expect } from 'vitest'
import { act, renderWithClient, screen, test, userEvent, waitFor } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import type { ProductActiveStatus, ProductBody, ProductFilterDTO } from '@/types/product'
import { ACTIVE_PRODUCTS } from '@/utils/filterConstants'
import { ProductList } from './ProductList'
import { GroupedProductList } from './GroupedProductList'

const productsApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/products'

const filter: ProductFilterDTO = {
    active: ACTIVE_PRODUCTS as ProductActiveStatus,
    deleted: 'false',
    sort: ''
}

const createProductBody = (productId: number, name: string): ProductBody => ({
    product: {
        active: true,
        productId: productId,
        name: name,
        link: '',
        store: 'Store 1',
        createdAt: '2026-09-04T00:00:00.000Z',
        deletedAt: null,
        updatedAt: '2026-09-04T00:00:00.000Z',
        prices: []
    },
    priceToday: undefined,
    nextPrice: undefined,
    priceCategory: '',
    lastUpdated: '2026-09-04T00:00:00.000Z'
})

const productA = createProductBody(1, 'Product A')
const productB = createProductBody(2, 'Product B')
const productC = createProductBody(3, 'Product C')

// Names of the products whose accordion items are open
const getOpenedProductNames = () =>
    screen
        .queryAllByRole('button', { expanded: true })
        .map((button) => button.textContent)
        .filter((text) => text?.startsWith('Product'))

describe('Product List Component', () => {
    test('should keep the open product open when a product is added above it', async ({ worker }) => {
        let productBodies = [productA, productB]
        worker.use(
            http.get(productsApiUrl, () => HttpResponse.json({ content: productBodies, count: productBodies.length }))
        )
        const user = userEvent.setup()
        const { queryClient } = renderWithClient(<ProductList filter={filter} />)

        await user.click(await screen.findByRole('button', { name: /Product B/ }))
        await waitFor(() => expect(getOpenedProductNames()).toEqual([expect.stringContaining('Product B')]))

        productBodies = [productC, productA, productB]
        await act(() => queryClient.invalidateQueries())
        await screen.findByRole('button', { name: /Product C/ })

        await waitFor(() => expect(getOpenedProductNames()).toEqual([expect.stringContaining('Product B')]))
    })
})

describe('Grouped Product List Component', () => {
    test('should keep the open group open when a group is added above it', async ({ worker }) => {
        let groups = [
            { name: 'Product A', products: [productA] },
            { name: 'Product B', products: [productB] }
        ]
        worker.use(
            http.get(productsApiUrl + '/grouped', () => HttpResponse.json({ content: groups, count: groups.length }))
        )
        const user = userEvent.setup()
        const { queryClient } = renderWithClient(<GroupedProductList filter={filter} />)

        await user.click(await screen.findByRole('button', { name: /Product B/ }))
        await waitFor(() => expect(getOpenedProductNames()).toEqual([expect.stringContaining('Product B')]))

        groups = [{ name: 'Product C', products: [productC] }, ...groups]
        await act(() => queryClient.invalidateQueries())
        await screen.findByRole('button', { name: /Product C/ })

        await waitFor(() => expect(getOpenedProductNames()).toEqual([expect.stringContaining('Product B')]))
    })
})
