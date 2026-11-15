import { afterEach, describe, expect, vi } from 'vitest'
import { createPrice, createProduct, createProductBody, renderWithClient, screen, test } from '@/test-utils'
import type { ProductBody } from '@/types/product'
import { PriceBanner } from './PriceBanner'

const product = createProduct(1)

const price1 = createPrice(1, { currency: 'USD', today: true, totalAmount: 100.0 })

const productBodyNoPrice = createProductBody(product)

const productBodyWithPrice: ProductBody = { ...productBodyNoPrice, priceToday: price1 }

/**
 * Renders the small banner the grouped list's store picker shows.
 * @param priceCategory The low today's price is at, such as 'one-year', or '' for none
 * @param totalPercentage Today's discount as a fraction (0.2 for 20% off)
 */
const renderMiniBanner = (priceCategory: string, totalPercentage: number) => {
    const priceToday = createPrice(1, { currency: 'USD', today: true, totalAmount: 80.0, totalPercentage })

    renderWithClient(
        <PriceBanner
            productBody={{ ...productBodyNoPrice, priceToday, priceCategory }}
            dateToday={new Date()}
            setDateToday={() => {}}
            mini
        />
    )
}

describe('PriceBanner Component', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    test('should render the price', async () => {
        renderWithClient(
            <PriceBanner productBody={productBodyWithPrice} dateToday={new Date()} setDateToday={() => {}} />
        )

        const priceText = screen.getByText('$100.00')
        await expect.element(priceText).toBeInTheDocument()
    })

    test('should show a sparkle when the price is below average', async () => {
        renderWithClient(
            <PriceBanner
                productBody={{ ...productBodyWithPrice, belowAverage: true }}
                dateToday={new Date()}
                setDateToday={() => {}}
            />
        )

        await expect.element(screen.getByRole('img', { name: 'Below average price' })).toHaveTextContent('✨')
    })

    test('should not show a sparkle when the price is not below average', async () => {
        renderWithClient(
            <PriceBanner productBody={productBodyWithPrice} dateToday={new Date()} setDateToday={() => {}} />
        )

        expect(screen.queryByRole('img', { name: 'Below average price' })).not.toBeInTheDocument()
    })

    test('should render nothing once the price for today is removed', async () => {
        const { rerender } = renderWithClient(
            <PriceBanner productBody={productBodyWithPrice} dateToday={new Date()} setDateToday={() => {}} />
        )

        rerender(<PriceBanner productBody={productBodyNoPrice} dateToday={new Date()} setDateToday={() => {}} />)

        expect(screen.queryByText('$100.00')).toBeNull()
    })

    test('should show the discount in the small banner when a low has one', async () => {
        renderMiniBanner('one-year', 0.2)

        await expect.element(screen.getByText('-20%')).toBeInTheDocument()
    })

    // A low can come from the regular price dropping, with no discount, and "-0%" wouldn't say it's a low
    test.each([
        ['one-year', '1-yr low'],
        ['two-year', '2-yr low'],
        ['all-time', 'Lowest']
    ])('should show a short label in the small banner when the %s low has no discount', async (category, label) => {
        renderMiniBanner(category, 0)

        await expect.element(screen.getByText(label)).toBeInTheDocument()
        expect(screen.queryByText('-0%')).not.toBeInTheDocument()
    })

    test('should show no small banner when the price is not at a low', async () => {
        renderMiniBanner('', 0.2)

        expect(screen.queryByText('-20%')).not.toBeInTheDocument()
    })

    test('should stop the price timer once the price for today is removed', async () => {
        const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')
        const nextPrice = createPrice(2, { priceStarted: new Date(Date.now() + 60_000).toISOString() })
        const { rerender } = renderWithClient(
            <PriceBanner
                productBody={{ ...productBodyWithPrice, nextPrice: nextPrice }}
                dateToday={new Date()}
                setDateToday={() => {}}
            />
        )

        rerender(<PriceBanner productBody={productBodyNoPrice} dateToday={new Date()} setDateToday={() => {}} />)

        expect(clearTimeoutSpy).toHaveBeenCalled()
    })
})
