import { describe, expect } from 'vitest'
import { createPrice, createProduct, renderWithClient, screen, test, userEvent } from '@/test-utils'
import { GroupedProduct } from './GroupedProduct'
import { Accordion } from '@mantine/core'
import { useState } from 'react'
import type { ProductBody } from '@/types/product'

const product = createProduct(1, { name: 'Product 1' })

const product2 = createProduct(1, { name: 'Product 1', deletedAt: new Date(2026, 8, 6, 12).toISOString() })

const price1 = createPrice(1)

const productBody: ProductBody = {
    product: product,
    priceToday: price1,
    nextPrice: undefined,
    priceCategory: '',
    lastUpdated: new Date(2026, 8, 4, 12).toISOString()
}

const productBody2: ProductBody = {
    product: product2,
    priceToday: price1,
    nextPrice: undefined,
    priceCategory: '',
    lastUpdated: new Date(2026, 8, 4, 12).toISOString()
}

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

    test('should render delete product button', async () => {
        renderWithAccordion(
            <Accordion.Item value="item-1">
                <GroupedProduct productBodies={[productBody]} dateToday={new Date()} setDateToday={() => {}} />
            </Accordion.Item>
        )

        const deleteProductButton = screen.getByRole('img', { name: /delete product/i })
        await expect.element(deleteProductButton).toBeInTheDocument()
    })

    test('should not render delete product button', async () => {
        renderWithAccordion(
            <Accordion.Item value="item-1">
                <GroupedProduct productBodies={[productBody2]} dateToday={new Date()} setDateToday={() => {}} />
            </Accordion.Item>
        )

        const deleteProductButton = screen.queryByRole('img', { name: 'Delete product' })
        await expect.element(deleteProductButton).not.toBeInTheDocument()
    })

    test('should render permanently delete button for a deleted product', async () => {
        renderWithAccordion(
            <Accordion.Item value="item-1">
                <GroupedProduct productBodies={[productBody2]} dateToday={new Date()} setDateToday={() => {}} />
            </Accordion.Item>
        )

        const permanentlyDeleteButton = screen.getByRole('img', { name: 'Permanently delete product' })
        await expect.element(permanentlyDeleteButton).toBeInTheDocument()
    })

    test('should not render permanently delete button for a product that is not deleted', async () => {
        renderWithAccordion(
            <Accordion.Item value="item-1">
                <GroupedProduct productBodies={[productBody]} dateToday={new Date()} setDateToday={() => {}} />
            </Accordion.Item>
        )

        expect(screen.queryByRole('img', { name: 'Permanently delete product' })).not.toBeInTheDocument()
    })

    test('should render restore product button for a deleted product', async () => {
        renderWithAccordion(
            <Accordion.Item value="item-1">
                <GroupedProduct productBodies={[productBody2]} dateToday={new Date()} setDateToday={() => {}} />
            </Accordion.Item>
        )

        const restoreProductButton = screen.getByRole('img', { name: /restore product/i })
        await expect.element(restoreProductButton).toBeInTheDocument()
    })

    test('should not render restore product button', async () => {
        renderWithAccordion(
            <Accordion.Item value="item-1">
                <GroupedProduct productBodies={[productBody]} dateToday={new Date()} setDateToday={() => {}} />
            </Accordion.Item>
        )

        const restoreProductButton = screen.queryByRole('img', { name: /restore product/i })
        await expect.element(restoreProductButton).not.toBeInTheDocument()
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

    test('should strike through and gray out only the store of a deleted product', async () => {
        const deletedStoreABody: ProductBody = {
            ...storeABody,
            product: { ...storeABody.product, deletedAt: new Date(2026, 8, 4, 12).toISOString() }
        }
        renderWithAccordion(<StoreSelectionHarness initialBodies={[deletedStoreABody, storeBBody]} />)

        await expect.element(screen.getByText('Store A', { exact: true })).toHaveClass('line-through', 'text-raincloud')
        await expect.element(screen.getByText(fullText('Store A (+1 other store)'))).not.toHaveClass('line-through')
    })

    test('should show the first store when the chosen store leaves the list', async () => {
        const user = userEvent.setup()
        renderWithAccordion(<StoreSelectionHarness initialBodies={[storeABody, storeBBody]} />)

        await chooseStore(user, 'Store A', 'Store B')
        await user.click(screen.getByRole('button', { name: 'Remove Store B' }))

        await expect.element(await screen.findByRole('button', { name: 'Store A' })).toBeInTheDocument()
    })
})
