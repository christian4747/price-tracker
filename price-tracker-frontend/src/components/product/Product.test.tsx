import { afterEach, beforeEach, describe, expect } from 'vitest'
import { page, userEvent as pointer } from 'vitest/browser'
import { createPrice, createProduct, createProductBody, renderWithClient, screen, test, userEvent } from '@/test-utils'
import type { ProductBody } from '@/types/product'
import { Product } from './Product'
import { Accordion } from '@mantine/core'
import { useState } from 'react'
import { http, HttpResponse } from 'msw'
import { getPriceString } from '@/utils/priceUtils'
// The actions button fades in and out with Tailwind classes, so the visibility tests need the app's styles
import '@/styles/index.css'

const product = createProduct(1, { name: 'Product 1' })

const price1 = createPrice(1)

const productBody = createProductBody(product, { priceToday: price1 })

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

describe('Product title layout', () => {
    // Above 1024 px wide the root font is 18 px, so the title's parts reach their desktop maximum widths
    let defaultViewport = { width: 0, height: 0 }
    beforeEach(async () => {
        defaultViewport = { width: window.innerWidth, height: window.innerHeight }
        await page.viewport(1280, 900)
    })
    afterEach(async () => {
        await page.viewport(defaultViewport.width, defaultViewport.height)
    })

    // The name, store, and brand each cut off at a maximum width, but at those maximums together they need more room
    // than a row leaves beside the price, so the title has to shrink rather than push the price out
    test("should keep the price inside its row when the product's name, store, and brand are long", async () => {
        const longProduct = createProduct(1, {
            name: 'Extra large adjustable standing desk converter with keyboard tray and monitor shelf',
            store: 'Maple Home Goods and Furniture Outlet',
            brand: 'Meridian Workspace Solutions International'
        })
        // 800 px, narrower than the three maximum widths added up (about 836 px), so a title that can't shrink has to
        // push the price out
        renderWithClient(
            <div style={{ width: 800 }}>
                <Accordion variant="unstyled" value={[]} multiple>
                    <Product
                        productBody={createProductBody(longProduct, { priceToday: price1 })}
                        setDateToday={() => {}}
                        dateToday={new Date()}
                        value="item-1"
                    />
                </Accordion>
            </div>
        )

        const row = document.querySelector('.mantine-Accordion-item')!.getBoundingClientRect()
        const price = (await screen.findByText(getPriceString(price1))).getBoundingClientRect()
        expect(price.right, `price ends at ${price.right} px, row at ${row.right} px`).toBeLessThanOrEqual(row.right)
    })
})

describe('Product Component', () => {
    test('should render product name', async () => {
        renderWithAccordion(
            <Product productBody={productBody} setDateToday={() => {}} dateToday={new Date()} value={'item-1'} />
        )

        const productName = screen.getByText('Product 1')
        await expect.element(productName).toBeInTheDocument()
    })

    // Both come from the product's whole price history, so a shorter time range doesn't change them
    test('should keep the average price and sparkle when the time range changes', async ({ worker }) => {
        const cheapOldPrice = createPrice(3, { totalAmount: 1, priceStarted: new Date(2020, 0, 1, 12).toISOString() })
        worker.use(
            http.get(import.meta.env.VITE_BACKEND_ROOT_URL + '/prices/product/:productId', ({ request }) => {
                const isAll = !new URL(request.url).searchParams.has('startDate')
                return HttpResponse.json(isAll ? [price1, cheapOldPrice] : [price1])
            })
        )
        const user = userEvent.setup()
        renderWithAccordion(
            <Product
                productBody={{ ...productBody, averagePrice: 15, weightedAveragePrice: 17.5, belowAverage: true }}
                setDateToday={() => {}}
                dateToday={new Date()}
                value={'item-1'}
            />
        )
        await screen.findByText('Average price: $15.00')

        await user.click(screen.getByText('All'))
        // The old price only arrives with the All range, so seeing its row means the new range's prices have loaded,
        // and the checks below aren't made against the old range
        await screen.findByText('Jan 1, 2020')

        expect(screen.getByText('Average price: $15.00')).toBeInTheDocument()
        expect(screen.getByRole('img', { name: 'Below average price' })).toBeInTheDocument()
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

    // A button or link inside the row's own button is invalid HTML, and can't be reached properly with the keyboard
    test("should keep buttons and links out of the row's toggle", async () => {
        renderWithAccordion(
            <Product productBody={productBody} setDateToday={() => {}} dateToday={new Date()} value={'item-1'} />
        )

        const toggle = document.querySelector('.mantine-Accordion-control')!
        expect(toggle.querySelectorAll('button, a, [role="button"]')).toHaveLength(0)
    })

    test('should keep the row open when its actions menu is opened', async () => {
        const user = userEvent.setup()
        renderWithAccordion(
            <Product productBody={productBody} setDateToday={() => {}} dateToday={new Date()} value={'item-1'} />
        )

        await user.click(screen.getByRole('button', { name: 'Product actions' }))
        await screen.findByRole('menu')

        await expect
            .element(document.querySelector<HTMLElement>('.mantine-Accordion-control')!)
            .toHaveAttribute('aria-expanded', 'true')
    })

    describe('actions button visibility', () => {
        // The button's opacity once any fade has finished
        const actionsOpacity = () =>
            expect.poll(() => getComputedStyle(screen.getByRole('button', { name: 'Product actions' })).opacity)

        // A closed row, since an open row always shows its actions
        const renderClosedRow = () =>
            renderWithAccordion(
                <Product productBody={productBody} setDateToday={() => {}} dateToday={new Date()} value={'item-2'} />
            )

        // Faint rather than hidden, so it's still clear each row has actions
        test('should show the actions button faintly while the row is closed and not hovered', async () => {
            renderClosedRow()

            await actionsOpacity().toBe('0.3')
        })

        // Moves the real mouse, since CSS :hover only follows the real pointer, not the events userEvent sends. The
        // mouse stays put between tests, so it's moved off the row before the row is removed, even if the check fails
        test('should show the actions button fully while the row is hovered', async () => {
            renderClosedRow()
            const name = screen.getByText('Product 1')

            await pointer.hover(name)
            try {
                await actionsOpacity().toBe('1')
            } finally {
                await pointer.unhover(name)
            }
        })

        test('should show the actions button fully while the row is open', async () => {
            renderWithAccordion(
                <Product productBody={productBody} setDateToday={() => {}} dateToday={new Date()} value={'item-1'} />
            )

            await actionsOpacity().toBe('1')
        })

        // Tab can reach a faint button, so it has to show fully once it has focus
        test('should show the actions button fully when Tab reaches it', async () => {
            const user = userEvent.setup()
            renderClosedRow()

            await user.tab()
            await user.tab()

            expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Product actions' }))
            await actionsOpacity().toBe('1')
        })

        test('should keep the actions button showing fully while its menu is open', async () => {
            const user = userEvent.setup()
            renderClosedRow()

            await user.click(screen.getByRole('button', { name: 'Product actions' }))
            // Moving into the menu leaves the row, which is drawn apart from it
            await user.hover(await screen.findByRole('menu'))

            await actionsOpacity().toBe('1')
        })
    })
})
