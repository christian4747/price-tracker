import { describe, expect } from 'vitest'
import { renderWithClient, screen, test } from '@/test-utils'
import type { ProductType } from '@/utils/Types'
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
        renderWithAccordion(<Product product={product} setDateToday={() => { }} dateToday={new Date()} value={'item-1'} />)

        const productName = screen.getByText('Product 1')
        await expect.element(productName).toBeInTheDocument()
    })
})