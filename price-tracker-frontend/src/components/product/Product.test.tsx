import { describe, expect } from 'vitest'
import { createPrice, createProduct, renderWithClient, screen, test } from '@/test-utils'
import type { ProductBody } from '@/types/product'
import { Product } from './Product'
import { Accordion } from '@mantine/core'
import { useState } from 'react'

const product = createProduct(1, { name: 'Product 1' })

const price1 = createPrice(1)

const productBody: ProductBody = {
    product: product,
    priceToday: price1,
    nextPrice: undefined,
    priceCategory: '',
    lastUpdated: new Date(2026, 8, 4, 12).toISOString()
}

// Built from local times so the expected text doesn't depend on the test machine's time zone
const datedProductBody: ProductBody = {
    ...productBody,
    product: {
        ...product,
        createdAt: new Date(2026, 7, 31, 14, 5).toISOString(),
        updatedAt: new Date(2026, 9, 28, 9, 30).toISOString()
    }
}
const datesText = 'Added Aug 31, 2026 2:05 PM · Last updated Oct 28, 2026 9:30 AM'

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

describe('Product Component', () => {
    test('should render product name', async () => {
        renderWithAccordion(
            <Product productBody={productBody} setDateToday={() => {}} dateToday={new Date()} value={'item-1'} />
        )

        const productName = screen.getByText('Product 1')
        await expect.element(productName).toBeInTheDocument()
    })

    test('should show when the product was added and last updated while opened', async () => {
        renderWithAccordion(
            <Product productBody={datedProductBody} setDateToday={() => {}} dateToday={new Date()} value={'item-1'} />
        )

        await expect.element(screen.getByText(datesText)).toBeVisible()
    })

    test('should hide when the product was added and last updated while closed', async () => {
        renderWithAccordion(
            <Product productBody={datedProductBody} setDateToday={() => {}} dateToday={new Date()} value={'item-2'} />
        )

        await expect.element(screen.getByText('Product 1')).toBeInTheDocument()
        // A closed panel keeps its content mounted, just hidden
        await expect.element(screen.getByText(datesText)).not.toBeVisible()
    })
})
