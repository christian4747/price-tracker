import type { ComponentType } from 'react'
import { describe, expect } from 'vitest'
import { act, createProduct, createProductBody, renderWithClient, screen, test, userEvent, waitFor } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import type { SetupWorker } from 'msw/browser'
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

const productA = createProductBody(createProduct(1, { name: 'Product A' }))
const productB = createProductBody(createProduct(2, { name: 'Product B' }))
const productC = createProductBody(createProduct(3, { name: 'Product C' }))

// Names of the products whose accordion items are open
const getOpenedProductNames = () =>
    screen
        .queryAllByRole('button', { expanded: true })
        .map((button) => button.textContent)
        .filter((text) => text?.startsWith('Product'))

const productLists = [
    { name: 'Product List', List: ProductList },
    { name: 'Grouped Product List', List: GroupedProductList }
]

// Renders a list of the given products, with each one in its own group in the grouped list
const renderList = (
    worker: SetupWorker,
    List: ComponentType<{ filter: ProductFilterDTO }>,
    products: ProductBody[]
) => {
    worker.use(
        http.get(productsApiUrl, () => HttpResponse.json({ content: products, count: products.length })),
        http.get(productsApiUrl + '/grouped', () =>
            HttpResponse.json({
                content: products.map((productBody) => ({ name: productBody.product.name, products: [productBody] })),
                count: products.length
            })
        )
    )
    renderWithClient(<List filter={filter} />)
}

// Clicks the given action on the last product in the list
const clickLastProductAction = async (name: string) => {
    const user = userEvent.setup()
    const buttons = await screen.findAllByRole('img', { name })
    await user.click(buttons[buttons.length - 1])
}

// Serves a count that needs two pages, and records the page and name of each request
const recordPageRequests = (worker: SetupWorker) => {
    const requests: { page: string | null; name: string | null }[] = []
    const resolver = ({ request }: { request: Request }) => {
        const params = new URL(request.url).searchParams
        requests.push({ page: params.get('page'), name: params.get('name') })
        return HttpResponse.json({ content: [], count: 11 })
    }
    worker.use(http.get(productsApiUrl, resolver), http.get(productsApiUrl + '/grouped', resolver))

    return requests
}

describe.for(productLists)('$name pagination', ({ List }) => {
    test('should go back to the first page when the filter changes', async ({ worker }) => {
        const requests = recordPageRequests(worker)
        const user = userEvent.setup()
        const { rerender } = renderWithClient(<List filter={filter} />)

        await user.click(await screen.findByRole('button', { name: '2' }))
        await waitFor(() => expect(requests).toContainEqual({ page: '1', name: null }))

        rerender(<List filter={{ ...filter, name: 'Product' }} />)

        await waitFor(() => expect(requests).toContainEqual({ page: '0', name: 'Product' }))
    })

    test('should not ask for the old page with the new filter', async ({ worker }) => {
        const requests = recordPageRequests(worker)
        const user = userEvent.setup()
        const { rerender } = renderWithClient(<List filter={filter} />)

        await user.click(await screen.findByRole('button', { name: '2' }))
        await waitFor(() => expect(requests).toContainEqual({ page: '1', name: null }))

        rerender(<List filter={{ ...filter, name: 'Product' }} />)

        await waitFor(() => expect(requests).toContainEqual({ page: '0', name: 'Product' }))
        expect(requests).not.toContainEqual({ page: '1', name: 'Product' })
    })

    test('should stay on the same page when the filter has not changed', async ({ worker }) => {
        const requests = recordPageRequests(worker)
        const user = userEvent.setup()
        const { rerender } = renderWithClient(<List filter={filter} />)

        await user.click(await screen.findByRole('button', { name: '2' }))
        await waitFor(() => expect(requests).toContainEqual({ page: '1', name: null }))

        rerender(<List filter={filter} />)

        await expect.element(screen.getByRole('button', { name: '2' })).toHaveAttribute('data-active')
    })
})

describe.for(productLists)('$name sorting', ({ List }) => {
    test('should send the sort in the request', async ({ worker }) => {
        const sorts: (string | null)[] = []
        const resolver = ({ request }: { request: Request }) => {
            sorts.push(new URL(request.url).searchParams.get('sort'))
            return HttpResponse.json({ content: [], count: 0 })
        }
        worker.use(http.get(productsApiUrl, resolver), http.get(productsApiUrl + '/grouped', resolver))

        renderWithClient(<List filter={{ ...filter, sort: 'currentPrice,desc' }} />)

        await waitFor(() => expect(sorts).toEqual(['currentPrice,desc']))
    })
})

describe.for(productLists)('$name product modals', ({ List }) => {
    test('should open the edit modal for the chosen product', async ({ worker }) => {
        renderList(worker, List, [productA, productB])

        await clickLastProductAction('Edit product')

        const nameInput = (await screen.findByRole('textbox', { name: 'Name' })) as HTMLInputElement
        await waitFor(() => expect(nameInput.value).toBe('Product B'))
    })

    test('should open the delete modal for the chosen product', async ({ worker }) => {
        renderList(worker, List, [productA, productB])

        await clickLastProductAction('Delete product')

        await expect
            .element(await screen.findByText('Are you sure you want to delete Product Product B?'))
            .toBeInTheDocument()
    })

    test('should open the permanently delete modal for the chosen product', async ({ worker }) => {
        const deletedAt = new Date(2026, 8, 6, 12).toISOString()
        const deletedProducts = [productA, productB].map((productBody) => ({
            ...productBody,
            product: { ...productBody.product, deletedAt }
        }))
        renderList(worker, List, deletedProducts)

        await clickLastProductAction('Permanently delete product')

        await expect
            .element(await screen.findByText(/permanently delete Product Product B at Store 1\?/))
            .toBeInTheDocument()
    })
})

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
