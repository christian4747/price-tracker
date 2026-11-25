import { describe, expect, test } from 'vitest'
import { createPrice } from '@/test-utils/createPrice'
import { getChartCurrency, getDefaultCurrency } from './currencyUtils'

describe('getDefaultCurrency', () => {
    // The backend saves a price without a currency as USD, so the default matches it until it can be set
    test('should be USD', () => {
        expect(getDefaultCurrency()).toBe('USD')
    })
})

describe('getChartCurrency', () => {
    // The average is in the currency of the price in effect today, so the chart's labels match it even when an
    // upcoming price at the top of the list uses another currency
    test("should use today's price currency over the newest listed price", () => {
        const priceToday = createPrice(1, { currency: 'JPY', today: true })
        const upcomingPrice = createPrice(2, { currency: 'EUR' })

        expect(getChartCurrency(priceToday, [upcomingPrice, priceToday])).toBe('JPY')
    })

    // Before any price has started there's no price today, but the chart still draws the upcoming prices
    test('should use the newest listed price when no price is in effect today', () => {
        const upcomingPrices = [createPrice(2, { currency: 'EUR' }), createPrice(1, { currency: 'JPY' })]

        expect(getChartCurrency(null, upcomingPrices)).toBe('EUR')
    })

    test('should use the default currency when the product has no prices', () => {
        expect(getChartCurrency(null, [])).toBe(getDefaultCurrency())
    })
})
