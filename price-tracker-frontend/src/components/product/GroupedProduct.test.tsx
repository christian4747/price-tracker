import { describe, expect, vi } from 'vitest'
import {
    createPrice,
    createProduct,
    createProductBody,
    renderWithClient,
    screen,
    test,
    userEvent,
    within
} from '@/test-utils'
import { GroupedProduct } from './GroupedProduct'
import { useState } from 'react'
import type { ProductBody } from '@/types/product'
import { EditProductContext } from './ProductContext'

const product = createProduct(1, { name: 'Product 1' })

const price1 = createPrice(1)

const productBody = createProductBody(product, { priceToday: price1 })

const storeABody: ProductBody = { ...productBody, product: { ...product, productId: 1, store: 'Store A' } }
const storeBBody: ProductBody = { ...productBody, product: { ...product, productId: 2, store: 'Store B' } }

// Lets tests replace productBodies the way a refetch would
function StoreSelectionHarness({ initialBodies }: { initialBodies: ProductBody[] }) {
    const [productBodies, setProductBodies] = useState(initialBodies)

    return (
        <>
            <button onClick={() => setProductBodies(productBodies.map((productBody) => ({ ...productBody })))}>
                Refetch
            </button>
            <button
                onClick={() =>
                    setProductBodies(productBodies.filter((productBody) => productBody.product.store !== 'Store B'))
                }
            >
                Remove Store B
            </button>
            <GroupedProduct productBodies={productBodies} dateToday={new Date()} setDateToday={() => {}} />
        </>
    )
}

// Matches the innermost element whose full text (including child elements) equals the given text
const fullText = (text: string) => (_: string, element: Element | null) =>
    element?.textContent === text && Array.from(element.children).every((child) => child.textContent !== text)

/**
 * Get the button that makes up the top of the group's row and opens its details.
 * @returns The row's button
 */
const rowButton = () => document.querySelector<HTMLElement>('button[aria-haspopup="dialog"]')!

/**
 * Open the group's details from its row, as a click would.
 * @param user The user to click with
 * @returns The details' window
 */
const openDetails = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(rowButton())
    return screen.findByRole('dialog')
}

/**
 * Close the group's details from their close button, so the row's own controls can be reached again.
 * @param user The user to click with
 */
const closeDetails = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: 'Close details' }))
    await expect.poll(() => screen.queryByRole('dialog')).not.toBeInTheDocument()
}

/**
 * Pick a store in the store picker, inside the group's details, opening them first if they're closed.
 * @param user The user to click with
 * @param fromStore The store the picker shows until then
 * @param toStore The store to pick
 */
const chooseStore = async (user: ReturnType<typeof userEvent.setup>, fromStore: string, toStore: string) => {
    if (!screen.queryByRole('dialog')) await openDetails(user)
    await user.click(await screen.findByRole('button', { name: fromStore }))
    await user.click(await screen.findByRole('option', { name: new RegExp(toStore, 'i') }))
    await expect.element(await screen.findByRole('button', { name: toStore })).toBeInTheDocument()
}

describe('Grouped Product Component', () => {
    test('should render grouped product', async () => {
        renderWithClient(
            <GroupedProduct productBodies={[productBody]} dateToday={new Date()} setDateToday={() => {}} />
        )

        await expect.element(within(rowButton()).getByText('Product 1')).toBeInTheDocument()
    })

    // A button or link inside the row's own button is invalid HTML, and can't be reached properly with the keyboard
    test("should keep buttons and links out of the row's button", async () => {
        renderWithClient(<StoreSelectionHarness initialBodies={[storeABody, storeBBody]} />)

        expect(rowButton().querySelectorAll('button, a, [role="button"]')).toHaveLength(0)
    })

    // The actions button sits beside the row's button, so opening its menu shouldn't count as a click on the row
    test('should keep the details closed when the actions menu is opened', async () => {
        const user = userEvent.setup()
        renderWithClient(<StoreSelectionHarness initialBodies={[storeABody, storeBBody]} />)

        await user.click(screen.getByRole('button', { name: 'Product actions' }))
        await screen.findByRole('menu')

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    test('should open the details with the store picker when the row is clicked', async () => {
        const user = userEvent.setup()
        renderWithClient(<StoreSelectionHarness initialBodies={[storeABody, storeBBody]} />)

        const dialog = await openDetails(user)

        expect(within(dialog).getByRole('button', { name: 'Store A' })).toBeVisible()
    })

    // The header shows the row's title bar, so it changes with the store the way the row does
    test("should show the chosen store's title in the details' header", async () => {
        const user = userEvent.setup()
        renderWithClient(<StoreSelectionHarness initialBodies={[storeABody, storeBBody]} />)

        await chooseStore(user, 'Store A', 'Store B')

        const heading = within(screen.getByRole('dialog')).getByRole('heading')
        expect(heading).toHaveTextContent('Store B (+1 other store)')
        expect(heading).not.toHaveTextContent('Store A')
    })

    // One menu for the whole group, so the details don't repeat the product's actions
    test('should offer one actions menu, for the chosen store', async () => {
        const openEditProductModal = vi.fn()
        const user = userEvent.setup()
        renderWithClient(
            <EditProductContext value={openEditProductModal}>
                <StoreSelectionHarness initialBodies={[storeABody, storeBBody]} />
            </EditProductContext>
        )

        await chooseStore(user, 'Store A', 'Store B')
        await closeDetails(user)
        expect(screen.getAllByRole('button', { name: 'Product actions' })).toHaveLength(1)
        await user.click(screen.getByRole('button', { name: 'Product actions' }))
        await user.click(await screen.findByRole('menuitem', { name: 'Edit' }))

        expect(openEditProductModal).toHaveBeenCalledWith(storeBBody.product)
    })

    // The details cover the row's menu, so the header's menu has to act on the same store as the row's did
    test("should offer the chosen store's actions in the details' header", async () => {
        const openEditProductModal = vi.fn()
        const user = userEvent.setup()
        renderWithClient(
            <EditProductContext value={openEditProductModal}>
                <StoreSelectionHarness initialBodies={[storeABody, storeBBody]} />
            </EditProductContext>
        )

        await chooseStore(user, 'Store A', 'Store B')
        await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Product actions' }))
        await user.click(await screen.findByRole('menuitem', { name: 'Edit' }))

        expect(openEditProductModal).toHaveBeenCalledWith(storeBBody.product)
    })

    test('should keep the chosen store when the product list is refetched', async () => {
        const user = userEvent.setup()
        renderWithClient(<StoreSelectionHarness initialBodies={[storeABody, storeBBody]} />)

        await chooseStore(user, 'Store A', 'Store B')
        await closeDetails(user)
        await user.click(screen.getByRole('button', { name: 'Refetch' }))

        await expect.element(within(rowButton()).getByText(fullText('Store B (+1 other store)'))).toBeInTheDocument()
    })

    test('should count every other store in the group', async () => {
        const storeCBody: ProductBody = { ...productBody, product: { ...product, productId: 3, store: 'Store C' } }
        renderWithClient(<StoreSelectionHarness initialBodies={[storeABody, storeBBody, storeCBody]} />)

        await expect.element(within(rowButton()).getByText(fullText('Store A (+2 other stores)'))).toBeInTheDocument()
    })

    test('should strike through only the name of a deleted product', async () => {
        const deletedStoreABody: ProductBody = {
            ...storeABody,
            product: { ...storeABody.product, deletedAt: new Date(2026, 8, 4, 12).toISOString() }
        }
        renderWithClient(<StoreSelectionHarness initialBodies={[deletedStoreABody, storeBBody]} />)
        const row = within(rowButton())

        await expect.element(row.getByText('Product 1')).toHaveClass('line-through', 'text-raincloud')
        await expect.element(row.getByText('Store A', { exact: true })).not.toHaveClass('line-through')
        await expect.element(row.getByText(fullText('Store A (+1 other store)'))).not.toHaveClass('line-through')
    })

    test('should show the brand of the chosen store', async () => {
        const brandedStoreABody: ProductBody = { ...storeABody, product: { ...storeABody.product, brand: 'Brand A' } }
        const brandedStoreBBody: ProductBody = { ...storeBBody, product: { ...storeBBody.product, brand: 'Brand B' } }
        const user = userEvent.setup()
        renderWithClient(<StoreSelectionHarness initialBodies={[brandedStoreABody, brandedStoreBBody]} />)

        await expect.element(within(rowButton()).getByText('Brand A')).toBeInTheDocument()
        await chooseStore(user, 'Store A', 'Store B')

        await expect.element(within(rowButton()).getByText('Brand B')).toBeInTheDocument()
        expect(within(rowButton()).queryByText('Brand A')).not.toBeInTheDocument()
    })

    test('should hide the brand when the chosen store has none', async () => {
        const brandedStoreABody: ProductBody = { ...storeABody, product: { ...storeABody.product, brand: 'Brand A' } }
        const user = userEvent.setup()
        renderWithClient(<StoreSelectionHarness initialBodies={[brandedStoreABody, storeBBody]} />)

        await chooseStore(user, 'Store A', 'Store B')

        expect(within(rowButton()).queryByText('Brand A')).not.toBeInTheDocument()
    })

    test('should show the first store when the chosen store leaves the list', async () => {
        const user = userEvent.setup()
        renderWithClient(<StoreSelectionHarness initialBodies={[storeABody, storeBBody]} />)

        await chooseStore(user, 'Store A', 'Store B')
        await closeDetails(user)
        await user.click(screen.getByRole('button', { name: 'Remove Store B' }))
        const dialog = await openDetails(user)

        await expect.element(within(dialog).getByRole('button', { name: 'Store A' })).toBeInTheDocument()
    })
})
