import type { ACTIVE_INACTIVE_PRODUCTS, ACTIVE_PRODUCTS, INACTIVE_PRODUCTS } from '@/utils/FilterConstants'
import type { PriceType } from '@/types/price'

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

export interface ProductDTO {
    name: string
    store: string
    link: string
    active: boolean
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
    brand?: string
    name?: string
    store?: string
    active: ProductActiveStatus
    startUpdatedAt?: string
    endUpdatedAt?: string
    startCreatedAt?: string
    endCreatedAt?: string
    deleted?: string
    startDeletedAt?: string
    endDeletedAt?: string
    sort?: string
}
