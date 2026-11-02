import { describe, expect, vi } from 'vitest'
import { createProduct, renderWithClient, screen, test, userEvent, waitFor } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import { PermanentlyDeleteProductContext } from './ProductContext'
import { ProductTitleDetails } from './ProductTitleDetails'

const productsApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/products'

const product = createProduct(1, { name: 'Product 1' })

const deletedProduct = createProduct(1, { name: 'Product 1', deletedAt: new Date(2026, 8, 6, 12).toISOString() })

const brandedProduct = createProduct(1, { brand: 'Brand 1', name: 'Product 1' })

describe('Product Title Details Component', () => {
    test('should render product delete button', async () => {
        renderWithClient(<ProductTitleDetails product={product} />)

        const deleteProductButton = screen.getByRole('img', { name: /delete product/i })
        await expect.element(deleteProductButton).toBeInTheDocument()
    })

    test('should not render product delete button', async () => {
        renderWithClient(<ProductTitleDetails product={deletedProduct} />)

        const deleteProductButton = screen.queryByRole('img', { name: 'Delete product' })
        await expect.element(deleteProductButton).not.toBeInTheDocument()
    })

    test('should not render permanently delete button for a product that is not deleted', async () => {
        renderWithClient(<ProductTitleDetails product={product} />)

        expect(screen.queryByRole('img', { name: 'Permanently delete product' })).not.toBeInTheDocument()
    })

    test('should open the permanently delete modal for a deleted product', async () => {
        const openPermanentlyDeleteProductModal = vi.fn()
        const user = userEvent.setup()
        renderWithClient(
            <PermanentlyDeleteProductContext value={openPermanentlyDeleteProductModal}>
                <ProductTitleDetails product={deletedProduct} />
            </PermanentlyDeleteProductContext>
        )

        await user.click(screen.getByRole('img', { name: 'Permanently delete product' }))

        expect(openPermanentlyDeleteProductModal).toHaveBeenCalledWith(deletedProduct)
    })

    test('should not render product restore button', async () => {
        renderWithClient(<ProductTitleDetails product={product} />)

        const restoreProductButton = screen.queryByRole('img', { name: /restore product/i })
        await expect.element(restoreProductButton).not.toBeInTheDocument()
    })

    test('should restore a deleted product', async ({ worker }) => {
        const restoredProductIds: string[] = []
        worker.use(
            http.put(productsApiUrl + '/:productId/restore', ({ params }) => {
                restoredProductIds.push(params.productId as string)
                return HttpResponse.json({ ...deletedProduct, deletedAt: null })
            })
        )
        const user = userEvent.setup()
        renderWithClient(<ProductTitleDetails product={deletedProduct} />)

        await user.click(screen.getByRole('img', { name: /restore product/i }))

        await waitFor(() => expect(restoredProductIds).toEqual(['1']))
    })

    test('should strike through and gray out the name of a deleted product', async () => {
        renderWithClient(<ProductTitleDetails product={deletedProduct} />)

        await expect.element(screen.getByText('Product 1')).toHaveClass('line-through', 'text-raincloud')
    })

    test('should not strike through the store and brand of a deleted product', async () => {
        renderWithClient(<ProductTitleDetails product={{ ...deletedProduct, store: 'Store 1', brand: 'Brand 1' }} />)

        await expect.element(screen.getByText('Store 1')).not.toHaveClass('line-through')
        await expect.element(screen.getByText('Brand 1')).not.toHaveClass('line-through')
    })

    test('should show the brand after the store', async () => {
        renderWithClient(<ProductTitleDetails product={brandedProduct} />)

        const brand = screen.getByText('Brand 1')
        await expect.element(brand).toHaveClass('text-raincloud')
        expect(screen.getByText('Store 1').compareDocumentPosition(brand)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    })

    test('should separate the name, store, and brand with dots', async () => {
        renderWithClient(<ProductTitleDetails product={brandedProduct} />)

        expect(screen.getByText('Product 1').parentElement?.textContent).toBe('Product 1·Store 1·Brand 1')
    })

    test.for([null, ''])('should not show a brand when it is %j', async (brand) => {
        renderWithClient(<ProductTitleDetails product={{ ...product, brand }} />)

        // Nothing, not even an empty element or a dot, comes after the store
        expect(screen.getByText('Store 1').parentElement?.nextElementSibling).toBeNull()
    })

    test('should truncate a long brand and show it in full on hover', async () => {
        const brand = 'A very long brand name that would push the product name out of its space'
        renderWithClient(<ProductTitleDetails product={{ ...product, brand }} />)

        await expect.element(screen.getByText(brand)).toHaveClass('truncate')
        await expect.element(screen.getByText(brand)).toHaveAttribute('title', brand)
    })

    test('should truncate a long store and show it in full on hover', async () => {
        const store = 'A very long store name that would push the icons out of place'
        renderWithClient(<ProductTitleDetails product={{ ...product, store }} otherStoresText="(+1 other store)" />)

        await expect.element(screen.getByText(store)).toHaveClass('truncate')
        await expect.element(screen.getByText(store)).toHaveAttribute('title', store)
        // Only the store is cut off, so the count of other stores stays visible
        await expect.element(screen.getByText('(+1 other store)', { exact: false })).not.toHaveClass('truncate')
    })

    test('should not strike through the name and store of a product', async () => {
        renderWithClient(<ProductTitleDetails product={{ ...product, store: 'Store 1' }} />)

        await expect.element(screen.getByText('Product 1')).not.toHaveClass('line-through')
        await expect.element(screen.getByText('Store 1')).not.toHaveClass('line-through')
    })
})
