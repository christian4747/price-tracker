export interface PriceType {
    priceId: number
    amount: number
    currency: string
    createdAt: string
    deletedAt: string | null
    description: string
    discountAmount: number
    discountPercentage: number
    priceEnded: string
    priceStarted: string
    productId: number
    returnAmount: number
    returnPercentage: number
    today: boolean
    totalAmount: number
    totalPercentage: number
    updatedAt: string
}

export interface PriceDTO {
    amount: number
    currency: string
    description: string
    discountAmount: number
    discountPercentage: number
    priceEnded: string
    priceStarted: string
    productId: number
    returnAmount: number
    returnPercentage: number
    totalAmount: number
    totalPercentage: number
}

export interface PriceRangeDTO extends PriceDTO {
    useEndDateDesc: boolean
}

// The start and end dates of a recent price, from recent price data
export interface PricePeriod {
    priceStarted: string
    priceEnded: string
}

// A product's recent values, newest first, offered as quick picks in the price forms
export interface RecentPriceData {
    baseAmounts: number[]
    currencies: string[]
    descriptions: string[]
    discountPercentages: number[]
    pricesStarted: string[]
    pricesEnded: string[]
    returnPercentages: number[]
    pricePeriods: PricePeriod[]
}
