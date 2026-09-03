export interface ProductType {
    active: boolean
    productId: number
    name: string
    link: string
    store: string
    createdAt: string
    updatedAt: string
    prices: PriceType[]
}

export interface PriceType {
    priceId: number
    amount: number
    currency: string
    createdAt: string
    description: string
    discountAmount: number
    discountPercentage: number
    priceEnded: string
    priceStarted: string
    productId: number
    returnAmount: number
    returnPercentage: number
    updatedAt: string
}

export interface ProductDTO {
    name: string
    store: string
    link: string
    active: boolean
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
}