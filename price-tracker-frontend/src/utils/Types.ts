type ProductType = {
    productId: number,
    name: string,
    link: string,
    store: string,
    createdAt: string,
    updatedAt: string,
    prices: PriceType[]
}

type PriceType = {
    priceId: number,
    amount: string,
    currency: string,
    priceStarted: string,
    priceEnded: string,
    createdAt: string,
    updatedAt: string,
    productId: number
}

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

export type {ModalProps, ProductModalProps, PriceModalProps, ProductDTO, PriceDTO, PriceType, ProductType}