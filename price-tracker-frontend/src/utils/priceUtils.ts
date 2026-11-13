import type { PriceType } from '@/types/price'

/**
 * Calculates the percentage from the given float. Percentages below 1 percent include 2 decimal points.
 * @param float The float to convert to a percentage.
 * @returns The calculated percentage from the given float
 */
const getPercentage = (float: number) => {
    const percentage = parseFloat((float * 100).toFixed(2))
    return percentage > 1 ? Math.round(percentage) : percentage
}

// Gets the discount percentage for the given Price
const getPriceDiscount = (price: PriceType | undefined) => {
    if (!price) return 0

    return getPercentage(price.totalPercentage)
}

/**
 * Get the Price's total amount in the given currency format, default to USD.
 * @param price The price to format with currency
 * @returns The Price's total amount in the given currency format or an empty string
 */
const getPriceString = (price: PriceType | undefined) => {
    if (!price) return ''

    return getAmountString(price.totalAmount, price.currency || 'USD')
}

/**
 * Get an amount in the given currency format.
 * @param amount The amount to format
 * @param currency The currency to format it with
 * @returns The formatted amount
 */
const getAmountString = (amount: number, currency: string) => {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency }).format(amount)
}

/**
 * Get the discounted amount for a base amount and discount percentage.
 * @param amount The base amount
 * @param discountPercentage The discount as a fraction (0.2 for 20%)
 * @returns The amount after the discount
 */
const getDiscountAmount = (amount: number, discountPercentage: number) => {
    return amount - amount * discountPercentage
}

/**
 * Get the return amount for a return percentage, based on the lower of the discounted and base amounts.
 * @param amount The base amount
 * @param discountAmount The amount after the discount
 * @param returnPercentage The return as a fraction (0.05 for 5%)
 * @returns The amount returned
 */
const getReturnAmount = (amount: number, discountAmount: number, returnPercentage: number) => {
    return Math.min(discountAmount, amount) * returnPercentage
}

export { getPriceDiscount, getPercentage, getPriceString, getAmountString, getDiscountAmount, getReturnAmount }
