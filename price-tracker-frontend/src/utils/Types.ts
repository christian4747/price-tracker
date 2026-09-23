import type { ACTIVE_INACTIVE_PRODUCTS, ACTIVE_PRODUCTS, INACTIVE_PRODUCTS } from "./FilterConstants"

export interface ProductType {
    active: boolean
    productId: number
    name: string
    link: string
    store: string
    createdAt: string
    deletedAt: string | null
    updatedAt: string
    prices: PriceType[]
}

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
    totalAmount: number
    totalPercentage: number
}

export interface ProductBody {
    product: ProductType
    priceToday?: PriceType
    nextPrice?: PriceType
    lastUpdated: string
    priceCategory: string
}

export type ProductActiveStatus = typeof ACTIVE_INACTIVE_PRODUCTS | typeof ACTIVE_PRODUCTS | typeof INACTIVE_PRODUCTS

export interface ProductFilterDTO {
    brand: string,
    name: string,
    store: string,
    active: ProductActiveStatus,
    startUpdatedAt: string,
    endUpdatedAt: string,
    startCreatedAt: string,
    endCreatedAt: string,
    deleted: string,
    startDeletedAt: string,
    endDeletedAt: string
}