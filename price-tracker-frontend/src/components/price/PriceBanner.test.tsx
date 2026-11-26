import { afterEach, describe, expect, vi } from 'vitest'
import dayjs from 'dayjs'
import { createPrice, createProduct, createProductBody, renderWithClient, screen, test, userEvent } from '@/test-utils'
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

            setDateToday={() => {}}
            mini
        />
    )
}

// When the page was opened in the day count tests. Local noon, so adding whole days never crosses midnight.
const openedAt = new Date(2026, 10, 2, 12)

/**
 * Get the moment the given number of days after the page was opened.
 * @param days Days after openedAt, or before it when negative
 * @returns That moment as an ISO string, as the API sends dates
 */
const daysAfterOpening = (days: number) => dayjs(openedAt).add(days, 'day').toISOString()

/**
 * Hover the banner's only indicator icon, so its tooltip opens.
 * @param container The element the banner was rendered into
 * @returns The tooltip, ready to check
 */
const hoverOnlyIndicator = async (container: HTMLElement) => {
    // The indicator icons have no accessible name, so find the icon itself. Each test leaves exactly one showing.
    const icons = container.querySelectorAll('svg')
    expect(icons).toHaveLength(1)

    await userEvent.setup().hover(icons[0])

    return screen.getByRole('tooltip')
}

describe('PriceBanner Component', () => {
    afterEach(() => {
        vi.restoreAllMocks()
        vi.useRealTimers()
    })

    // The list sets its date once when it loads, so a price edited days later started after that date (#119)
    test('should count a price change from the current time when the page has been open for days', async () => {
        // Fake only the clock, so the tooltip's own timers still run
        vi.useFakeTimers({ toFake: ['Date'], now: openedAt })
        const { container, rerender } = renderWithClient(
            <PriceBanner productBody={productBodyWithPrice} setDateToday={() => {}} />
        )

        // Two days later, today's price is edited to start now, and the list refetches it
        vi.setSystemTime(daysAfterOpening(2))
        const editedPrice = { ...price1, priceStarted: daysAfterOpening(2) }
        rerender(
            <PriceBanner
                productBody={{ ...productBodyWithPrice, priceToday: editedPrice, lastUpdated: daysAfterOpening(2) }}

                setDateToday={() => {}}
            />
        )

        await expect.element(await hoverOnlyIndicator(container)).toHaveTextContent('Price change 0 days ago')
    })

    // The indicator only shows past a week, so a stale date can keep it hidden after a week has gone by (#119)
    test('should count the last update from the current time when the page has been open for days', async () => {
        vi.useFakeTimers({ toFake: ['Date'], now: openedAt })
        // Updated three days before opening: too recent for the indicator then
        const productBody = { ...productBodyWithPrice, lastUpdated: daysAfterOpening(-3) }
        const { container, rerender } = renderWithClient(
            <PriceBanner productBody={productBody} setDateToday={() => {}} />
        )

        // Six days later it's nine days since the update, and something makes the banner draw again
        vi.setSystemTime(daysAfterOpening(6))
        rerender(<PriceBanner productBody={{ ...productBody }} setDateToday={() => {}} />)

        await expect.element(await hoverOnlyIndicator(container)).toHaveTextContent('Last updated 9 days ago')
    })

    test('should render the price', async () => {
        renderWithClient(<PriceBanner productBody={productBodyWithPrice} setDateToday={() => {}} />)

        const priceText = screen.getByText('$100.00')
        await expect.element(priceText).toBeInTheDocument()
    })

    test('should show a sparkle when the price is below average', async () => {
        renderWithClient(
            <PriceBanner
                productBody={{ ...productBodyWithPrice, belowAverage: true }}

                setDateToday={() => {}}
            />
        )

        await expect.element(screen.getByRole('img', { name: 'Below average price' })).toHaveTextContent('✨')
    })

    test('should not show a sparkle when the price is not below average', async () => {
        renderWithClient(<PriceBanner productBody={productBodyWithPrice} setDateToday={() => {}} />)

        expect(screen.queryByRole('img', { name: 'Below average price' })).not.toBeInTheDocument()
    })

    test('should render nothing once the price for today is removed', async () => {
        const { rerender } = renderWithClient(
            <PriceBanner productBody={productBodyWithPrice} setDateToday={() => {}} />
        )

        rerender(<PriceBanner productBody={productBodyNoPrice} setDateToday={() => {}} />)

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

                setDateToday={() => {}}
            />
        )

        rerender(<PriceBanner productBody={productBodyNoPrice} setDateToday={() => {}} />)

        expect(clearTimeoutSpy).toHaveBeenCalled()
    })
})
