import { describe, expect } from 'vitest'
import { renderWithClient, screen, test, userEvent } from '@/test-utils'
import { GroupedProduct } from './GroupedProduct'
import { Accordion } from '@mantine/core'
import { useState } from 'react'
import type { PriceType } from '@/types/price'
import type { ProductBody, ProductType } from '@/types/product'

const product: ProductType = {
    active: false,
    productId: 0,
    name: 'Product 1',
    link: '',
    store: '',
    createdAt: '',
    deletedAt: null,
    updatedAt: '',
    prices: []
}

const product2: ProductType = {
    active: false,
    productId: 0,
    name: 'Product 1',
    link: '',
    store: '',
    createdAt: '',
    deletedAt: 'deleted',
    updatedAt: '',
    prices: []
}

const price1: PriceType = {
    priceId: 1,
    amount: 100.0,
    currency: '',
    description: '',
    discountAmount: 0.0,
    discountPercentage: 0.0,
    priceStarted: '2026-09-04T00:00:00.000Z',
    priceEnded: '',
    returnAmount: 0.0,
    returnPercentage: 0.0,
    today: false,
    totalAmount: 0.0,
    totalPercentage: 0.0,
    createdAt: '2026-09-04T00:00:00.000Z',
    deletedAt: null,
    updatedAt: '2026-09-04T00:00:00.000Z',
    productId: 0
}

const productBody: ProductBody = {
    product: product,
    priceToday: price1,
    nextPrice: undefined,
    priceCategory: '',
    lastUpdated: '2026-09-04T00:00:00.000Z'
}

const productBody2: ProductBody = {
    product: product2,
    priceToday: price1,
    nextPrice: undefined,
    priceCategory: '',
    lastUpdated: '2026-09-04T00:00:00.000Z'
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

        const deleteProductButton = screen.queryByRole('img', { name: /delete product/i })
        await expect.element(deleteProductButton).not.toBeInTheDocument()
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

        await chooseStore(user, 'Store B')
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
            product: { ...storeABody.product, deletedAt: '2026-09-04T00:00:00.000Z' }
        }
        renderWithAccordion(<StoreSelectionHarness initialBodies={[deletedStoreABody, storeBBody]} />)

        await expect.element(screen.getByText('Store A', { exact: true })).toHaveClass('line-through', 'text-raincloud')
        await expect.element(screen.getByText(fullText('Store A (+1 other store)'))).not.toHaveClass('line-through')
    })

    test('should show the first store when the chosen store leaves the list', async () => {
        const user = userEvent.setup()
        renderWithAccordion(<StoreSelectionHarness initialBodies={[storeABody, storeBBody]} />)

        await chooseStore(user, 'Store B')
        await user.click(screen.getByRole('button', { name: 'Remove Store B' }))

        await expect.element(await screen.findByRole('button', { name: 'Store A' })).toBeInTheDocument()
    })
})

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

const chooseStore = async (user: ReturnType<typeof userEvent.setup>, store: string) => {
    await user.click(await screen.findByRole('button', { name: 'Store A' }))
    await user.click(await screen.findByRole('option', { name: new RegExp(store, 'i') }))
    await expect.element(screen.getByText(fullText(`${store} (+1 other store)`))).toBeInTheDocument()
}
