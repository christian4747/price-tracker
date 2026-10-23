import type { ProductType } from '@/types/product'
import { createContext } from 'react'

export const EditProductContext = createContext<(product: ProductType) => void>(() => {})
export const DeleteProductContext = createContext<(product: ProductType) => void>(() => {})
