import type { ACTIVE_INACTIVE_PRODUCTS, ACTIVE_PRODUCTS, INACTIVE_PRODUCTS } from '@/utils/filterConstants'
import type { PriceType } from '@/types/price'

export interface ProductType {
    active: boolean
    productId: number
    brand: string | null
    name: string
    link: string
    store: string
    createdAt: string
    deletedAt: string | null
    updatedAt: string
}

export interface ProductDTO {
    brand: string | null
    name: string
    store: string
    link: string
    active: boolean
}

export interface ProductBody {
    product: ProductType
    priceToday: PriceType | null
    nextPrice: PriceType | null
    lastUpdated: string
    priceCategory: string
    averagePrice: number | null
    weightedAveragePrice: number | null
    belowAverage: boolean
}

// The products that share a name, from the grouped product list
export interface ProductNameGroup {
    name: string
    products: ProductBody[]
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
