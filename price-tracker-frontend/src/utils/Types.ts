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
    priceStarted: string
    priceEnded: string
    createdAt: string
    updatedAt: string
    productId: number
    description: string
    returnAmount: number
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
    priceStarted: string
    priceEnded: string
    productId: number
    description: string
    returnAmount: number
}