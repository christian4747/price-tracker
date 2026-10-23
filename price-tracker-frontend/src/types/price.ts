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
