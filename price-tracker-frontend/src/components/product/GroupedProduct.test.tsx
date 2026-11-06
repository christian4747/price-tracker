import { describe, expect, vi } from 'vitest'
import { createPrice, createProduct, createProductBody, renderWithClient, screen, test, userEvent } from '@/test-utils'
import { GroupedProduct } from './GroupedProduct'
import { Accordion } from '@mantine/core'
import { useState } from 'react'
import type { ProductBody } from '@/types/product'
import { EditProductContext } from './ProductContext'

const product = createProduct(1, { name: 'Product 1' })

const price1 = createPrice(1)

const productBody = createProductBody(product, { priceToday: price1 })

const renderWithAccordion = (ui: React.ReactNode) => {
    function AccordionWrapper({ children }: { children: React.ReactNode }) {
        const [currentlyOpened, setCurrentlyOpened] = useState<string[]>(['item-1'])

        return (
            <Accordion
                multiple
                variant="unstyled"
                styles={{
                    control: { cursor: 'default' },
                    chevron: { cursor: 'pointer' }
                }}
                chevronIconSize={24}
                value={currentlyOpened}
                onChange={setCurrentlyOpened}
            >
                {children}
            </Accordion>
        )
    }

    return renderWithClient(<AccordionWrapper>{ui}</AccordionWrapper>)
}

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
            <Accordion.Item value="item-1">
                <GroupedProduct productBodies={productBodies} dateToday={new Date()} setDateToday={() => {}} />
            </Accordion.Item>
        </>
    )
}

// Matches the innermost element whose full text (including child elements) equals the given text
const fullText = (text: string) => (_: string, element: Element | null) =>
    element?.textContent === text && Array.from(element.children).every((child) => child.textContent !== text)

// Picks toStore in the store picker, which shows fromStore until then
const chooseStore = async (user: ReturnType<typeof userEvent.setup>, fromStore: string, toStore: string) => {
    await user.click(await screen.findByRole('button', { name: fromStore }))
    await user.click(await screen.findByRole('option', { name: new RegExp(toStore, 'i') }))
    await expect.element(await screen.findByRole('button', { name: toStore })).toBeInTheDocument()
}

describe('Grouped Product Component', () => {
    test('should render grouped product', async () => {
        renderWithAccordion(
            <Accordion.Item value="item-1">
                <GroupedProduct productBodies={[productBody]} dateToday={new Date()} setDateToday={() => {}} />
            </Accordion.Item>
        )

        const productName = screen.getByText('Product 1')
        await expect.element(productName).toBeInTheDocument()
    })

    // A button or link inside the row's own button is invalid HTML, and can't be reached properly with the keyboard
    test("should keep buttons and links out of the row's toggle", async () => {
        renderWithAccordion(<StoreSelectionHarness initialBodies={[storeABody, storeBBody]} />)

        const toggle = document.querySelector('.mantine-Accordion-control')!
        expect(toggle.querySelectorAll('button, a, [role="button"]')).toHaveLength(0)
    })

    test('should keep the row open when its actions menu is opened', async () => {
        const user = userEvent.setup()
        renderWithAccordion(<StoreSelectionHarness initialBodies={[storeABody, storeBBody]} />)

        await user.click(screen.getByRole('button', { name: 'Product actions' }))
        await screen.findByRole('menu')

        await expect
            .element(document.querySelector<HTMLElement>('.mantine-Accordion-control')!)
            .toHaveAttribute('aria-expanded', 'true')
    })

    // One menu for the whole group, so the panel doesn't repeat the product's actions
    test('should offer one actions menu, for the chosen store', async () => {
        const openEditProductModal = vi.fn()
        const user = userEvent.setup()
        renderWithAccordion(
            <EditProductContext value={openEditProductModal}>
                <StoreSelectionHarness initialBodies={[storeABody, storeBBody]} />
            </EditProductContext>
        )

        await chooseStore(user, 'Store A', 'Store B')
        expect(screen.getAllByRole('button', { name: 'Product actions' })).toHaveLength(1)
        await user.click(screen.getByRole('button', { name: 'Product actions' }))
        await user.click(await screen.findByRole('menuitem', { name: 'Edit' }))

        expect(openEditProductModal).toHaveBeenCalledWith(storeBBody.product)
    })

    test('should keep the chosen store when the product list is refetched', async () => {
        const user = userEvent.setup()
        renderWithAccordion(<StoreSelectionHarness initialBodies={[storeABody, storeBBody]} />)

        await chooseStore(user, 'Store A', 'Store B')
        await user.click(screen.getByRole('button', { name: 'Refetch' }))

        await expect.element(screen.getByText(fullText('Store B (+1 other store)'))).toBeInTheDocument()
    })

    test('should count every other store in the group', async () => {
        const storeCBody: ProductBody = { ...productBody, product: { ...product, productId: 3, store: 'Store C' } }
        renderWithAccordion(<StoreSelectionHarness initialBodies={[storeABody, storeBBody, storeCBody]} />)

        await expect.element(screen.getByText(fullText('Store A (+2 other stores)'))).toBeInTheDocument()
    })

    test('should strike through only the name of a deleted product', async () => {
        const deletedStoreABody: ProductBody = {
            ...storeABody,
            product: { ...storeABody.product, deletedAt: new Date(2026, 8, 4, 12).toISOString() }
        }
        renderWithAccordion(<StoreSelectionHarness initialBodies={[deletedStoreABody, storeBBody]} />)

        await expect.element(screen.getByText('Product 1')).toHaveClass('line-through', 'text-raincloud')
        await expect.element(screen.getByText('Store A', { exact: true })).not.toHaveClass('line-through')
        await expect.element(screen.getByText(fullText('Store A (+1 other store)'))).not.toHaveClass('line-through')
    })

    test('should show the brand of the chosen store', async () => {
        const brandedStoreABody: ProductBody = { ...storeABody, product: { ...storeABody.product, brand: 'Brand A' } }
        const brandedStoreBBody: ProductBody = { ...storeBBody, product: { ...storeBBody.product, brand: 'Brand B' } }
        const user = userEvent.setup()
        renderWithAccordion(<StoreSelectionHarness initialBodies={[brandedStoreABody, brandedStoreBBody]} />)

        await expect.element(screen.getByText('Brand A')).toBeInTheDocument()
        await chooseStore(user, 'Store A', 'Store B')

        await expect.element(screen.getByText('Brand B')).toBeInTheDocument()
        expect(screen.queryByText('Brand A')).not.toBeInTheDocument()
    })

    test('should hide the brand when the chosen store has none', async () => {
        const brandedStoreABody: ProductBody = { ...storeABody, product: { ...storeABody.product, brand: 'Brand A' } }
        const user = userEvent.setup()
        renderWithAccordion(<StoreSelectionHarness initialBodies={[brandedStoreABody, storeBBody]} />)

        await chooseStore(user, 'Store A', 'Store B')

        expect(screen.queryByText('Brand A')).not.toBeInTheDocument()
    })

    test('should show the first store when the chosen store leaves the list', async () => {
        const user = userEvent.setup()
        renderWithAccordion(<StoreSelectionHarness initialBodies={[storeABody, storeBBody]} />)

        await chooseStore(user, 'Store A', 'Store B')
        await user.click(screen.getByRole('button', { name: 'Remove Store B' }))

        await expect.element(await screen.findByRole('button', { name: 'Store A' })).toBeInTheDocument()
    })
})
