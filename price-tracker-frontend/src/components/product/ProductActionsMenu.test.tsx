import { describe, expect, onTestFinished, vi } from 'vitest'
import { createProduct, renderWithClient, screen, test, userEvent, waitFor } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import type { ProductType } from '@/types/product'
import { DeleteProductContext, EditProductContext, PermanentlyDeleteProductContext } from './ProductContext'
import { ProductActionsMenu } from './ProductActionsMenu'
// The copy item keeps its width with Tailwind classes, so the menu tests need the app's styles
import '@/styles/index.css'

const productsApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/products'

const product = createProduct(1, { name: 'Product 1' })
const deletedProduct = createProduct(1, { name: 'Product 1', deletedAt: new Date(2026, 8, 6, 12).toISOString() })
const linkedProduct = createProduct(1, { name: 'Product 1', link: 'https://example.com/product-1' })

interface Handlers {
    edit?: (product: ProductType) => void
    delete?: (product: ProductType) => void
    permanentlyDelete?: (product: ProductType) => void
}

// Renders the menu with modal handlers that do nothing, unless a test passes its own
const renderMenu = (productToRender: ProductType, handlers: Handlers = {}) =>
    renderWithClient(
        <EditProductContext value={handlers.edit ?? (() => {})}>
            <DeleteProductContext value={handlers.delete ?? (() => {})}>
                <PermanentlyDeleteProductContext value={handlers.permanentlyDelete ?? (() => {})}>
                    <ProductActionsMenu product={productToRender} />
                </PermanentlyDeleteProductContext>
            </DeleteProductContext>
        </EditProductContext>
    )

// Opens the menu with a click and returns the names of its items, as shown. innerText leaves out invisible text, such
// as the copy item's hidden second label, where textContent would include it
const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: 'Product actions' }))
    await screen.findByRole('menu')
    return screen.getAllByRole('menuitem').map((item) => item.innerText)
}

describe('Product Actions Menu Component', () => {
    test('should offer editing, copying, and deleting a product', async () => {
        const user = userEvent.setup()
        renderMenu(product)

        expect(await openMenu(user)).toEqual(['Edit', 'Copy name', 'Delete'])
    })

    test('should offer restoring and permanently deleting a deleted product, instead of deleting it', async () => {
        const user = userEvent.setup()
        renderMenu(deletedProduct)

        expect(await openMenu(user)).toEqual(['Edit', 'Copy name', 'Restore', 'Permanently delete'])
    })

    test('should open the product link in a new tab', async () => {
        const user = userEvent.setup()
        renderMenu(linkedProduct)

        expect(await openMenu(user)).toContain('Open link')
        const link = screen.getByRole('menuitem', { name: 'Open link' })
        await expect.element(link).toHaveAttribute('href', 'https://example.com/product-1')
        await expect.element(link).toHaveAttribute('target', '_blank')
    })

    test.for([
        ['Edit', 'edit', product],
        ['Delete', 'delete', product],
        ['Permanently delete', 'permanentlyDelete', deletedProduct]
    ] as const)('should open the %s modal for the product', async ([item, handler, productToRender]) => {
        const open = vi.fn()
        const user = userEvent.setup()
        renderMenu(productToRender, { [handler]: open })

        await openMenu(user)
        await user.click(screen.getByRole('menuitem', { name: item }))

        expect(open).toHaveBeenCalledWith(productToRender)
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
        renderMenu(deletedProduct)

        await openMenu(user)
        await user.click(screen.getByRole('menuitem', { name: 'Restore' }))

        await waitFor(() => expect(restoredProductIds).toEqual(['1']))
    })

    test('should not offer Restore again while a restore is still running', async ({ worker }) => {
        let finishRestore = () => {}
        const restoreFinished = new Promise<void>((resolve) => (finishRestore = resolve))
        worker.use(
            http.put(productsApiUrl + '/:productId/restore', async () => {
                await restoreFinished
                return HttpResponse.json({ ...deletedProduct, deletedAt: null })
            })
        )
        const user = userEvent.setup()
        renderMenu(deletedProduct)

        await openMenu(user)
        await user.click(screen.getByRole('menuitem', { name: 'Restore' }))
        await openMenu(user)

        await expect.element(screen.getByRole('menuitem', { name: 'Restore' })).toBeDisabled()
        finishRestore()
    })

    test('should copy the product name and say so, keeping the menu open', async () => {
        const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
        onTestFinished(() => writeText.mockRestore())
        const user = userEvent.setup()
        renderMenu(product)

        await openMenu(user)
        await user.click(screen.getByRole('menuitem', { name: 'Copy name' }))

        expect(writeText).toHaveBeenCalledWith('Product 1')
        await expect.element(screen.getByRole('menuitem', { name: 'Copied' })).toBeVisible()
    })

    // "Copied" is shorter than "Copy name", and the menu shouldn't shrink under the pointer when it changes
    test('should keep the menu the same width while it says "Copied"', async () => {
        const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
        onTestFinished(() => writeText.mockRestore())
        const user = userEvent.setup()
        renderMenu(product)

        await openMenu(user)
        const menu = screen.getByRole('menu')
        const widthBefore = menu.getBoundingClientRect().width
        await user.click(screen.getByRole('menuitem', { name: 'Copy name' }))
        await screen.findByRole('menuitem', { name: 'Copied' })

        expect(menu.getBoundingClientRect().width).toBe(widthBefore)
    })

    test('should open with Enter and choose an item with the arrow keys', async () => {
        const openDelete = vi.fn()
        const user = userEvent.setup()
        renderMenu(product, { delete: openDelete })

        screen.getByRole('button', { name: 'Product actions' }).focus()
        await user.keyboard('{Enter}')
        await screen.findByRole('menu')
        // Moves down until Delete is focused, so the test doesn't depend on which item is focused first
        for (let i = 0; i < 5 && document.activeElement?.textContent !== 'Delete'; i++) {
            await user.keyboard('{ArrowDown}')
        }
        await user.keyboard('{Enter}')

        expect(openDelete).toHaveBeenCalledWith(product)
    })

    test('should close with Escape and go back to the menu button', async () => {
        const user = userEvent.setup()
        renderMenu(product)

        await openMenu(user)
        await user.keyboard('{Escape}')

        await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Product actions' }))
    })

    test('should name the menu button in its tooltip', async () => {
        const user = userEvent.setup()
        renderMenu(product)

        await user.hover(screen.getByRole('button', { name: 'Product actions' }))

        await expect.element(screen.getByRole('tooltip')).toHaveTextContent('Product actions')
    })

    // So screen readers say the button opens a menu, and whether the menu is open
    test('should mark the menu button as opening a menu, and as open while it is', async () => {
        const user = userEvent.setup()
        renderMenu(product)
        const button = screen.getByRole('button', { name: 'Product actions' })

        await expect.element(button).toHaveAttribute('aria-haspopup', 'menu')
        await expect.element(button).toHaveAttribute('aria-expanded', 'false')
        await openMenu(user)

        await expect.element(button).toHaveAttribute('aria-expanded', 'true')
    })
})
