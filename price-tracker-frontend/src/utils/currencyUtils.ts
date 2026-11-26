import type { PriceType } from '@/types/price'

// The currency to use when there's no price to take one from. It matches the USD the backend saves a price without a
// currency as. Read it through getDefaultCurrency rather than writing 'USD' where it's needed, so a setting for it
// only has to change this file.
const DEFAULT_CURRENCY = 'USD'

/**
 * Get the currency to use when there's no price to take one from. Every saved price has its own currency, so amounts
 * of a price are shown in that price's currency instead.
 * @returns The default currency code
 */
const getDefaultCurrency = () => DEFAULT_CURRENCY

/**
 * Get the currency the price chart labels its scale and average in. The average is in the currency of the price in
 * effect today, so that one comes first. Before any price has started there's none today, but the chart still draws
 * the upcoming prices, so the newest listed price comes next. The default is only for when the list has no prices, such
 * as when every price is deleted and Show deleted is off.
 * @param priceToday The price in effect today, or null when no price has started
 * @param prices The prices the chart draws, newest first
 * @returns The currency code
 */
const getChartCurrency = (priceToday: PriceType | null, prices: PriceType[]) => {
    return priceToday?.currency ?? prices[0]?.currency ?? getDefaultCurrency()
}

export { getChartCurrency, getDefaultCurrency }
