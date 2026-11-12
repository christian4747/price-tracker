export interface PriceType {
    priceId: number
    amount: number
    currency: string
    createdAt: string
    deletedAt: string | null
    description: string
    discountAmount: number
    discountPercentage: number
    // Null for a price with only a start date
    priceEnded: string | null
    priceStarted: string
    returnAmount: number
    returnPercentage: number
    today: boolean
    totalAmount: number
    totalPercentage: number
    updatedAt: string
}

// How far back the price chart and list go
export type PriceTimeRange = 'oneYear' | 'twoYears' | 'all'

export interface PriceDTO {
    amount: number
    currency: string
    description: string
    discountAmount: number
    discountPercentage: number
    // Null for a price with only a start date, as the API returns it
    priceEnded: string | null
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
