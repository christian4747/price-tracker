import type { PriceType, ProductType } from "../App"

type ModalProps = {
    hidden: boolean,
    toggleHidden: () => void
}

type ProductModalProps = ModalProps & {
    product: ProductType
}

type PriceModalProps = ModalProps & {
    price: PriceType
}

type ProductDTO = {
    name: string,
    store: string,
    link: string
}

type PriceDTO = {
    amount: number,
    currency: string,
    priceStarted: string,
    priceEnded: string,
    productId: number
}

export type {ModalProps, ProductModalProps, PriceModalProps, ProductDTO, PriceDTO}