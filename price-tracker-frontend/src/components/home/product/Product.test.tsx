import { describe, expect } from 'vitest'
import { renderWithClient, screen, test } from '@/test-utils'
import type { PriceType, ProductBody, ProductType } from '@/utils/Types'
import { Product } from './Product'
import { Accordion } from '@mantine/core'
import { useState } from 'react'

const product: ProductType = {
    active: false,
    productId: 0,
    name: 'Product 1',
    link: '',
    store: '',
    createdAt: '',
    updatedAt: '',
    prices: []
}

const price1: PriceType = {
    priceId: 1,
    amount: 100.0,
    currency: "",
    description: "",
    discountAmount: 0.0,
    discountPercentage: 0.0,
    priceStarted: "2026-09-04T00:00:00.000Z",
    priceEnded: "",
    returnAmount: 0.0,
    returnPercentage: 0.0,
    today: false,
    totalAmount: 0.0,
    totalPercentage: 0.0,
    createdAt: "2026-09-04T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
    productId: 0
}

const productBody: ProductBody = {
    product: product,
    priceToday: price1,
    nextPrice: undefined,
    priceCategory: "",
    lastUpdated: "2026-09-04T00:00:00.000Z"
}

const renderWithAccordion = (ui: React.ReactNode) => {

    function AccordionWrapper({children}: {children: React.ReactNode}) {

        const [currentlyOpened, setCurrentlyOpened] = useState<string[]>(['item-1'])

        return (
            <Accordion
                multiple
                variant="unstyled"
                styles={{
                    control: { cursor: 'default' },
                    chevron: { cursor: 'pointer' },
                }}
                chevronIconSize={24}
                value={currentlyOpened}
                onChange={setCurrentlyOpened}
            >
                {children}
            </Accordion>
        )
    }

    return renderWithClient(
        <AccordionWrapper>{ui}</AccordionWrapper>
    )
}

describe('Product Component', () => {
    test('should render product name', async () => {
        renderWithAccordion(<Product productBody={productBody} setDateToday={() => { }} dateToday={new Date()} value={'item-1'} />)

        const productName = screen.getByText('Product 1')
        await expect.element(productName).toBeInTheDocument()
    })
})