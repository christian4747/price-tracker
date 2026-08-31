import type { ProductType } from "@/utils/Types"
import { createContext } from "react"

export const EditProductContext = createContext<(product: ProductType) => void>(() => { })
export const DeleteProductContext = createContext<(product: ProductType) => void>(() => { })