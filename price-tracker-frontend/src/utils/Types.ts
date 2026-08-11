type ProductType = {
    active: boolean,
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
    productId: number,
    description: string
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
    link: string,
    active: boolean
}

type PriceDTO = {
    amount: string,
    currency: string,
    priceStarted: string,
    priceEnded: string,
    productId: number,
    description: string
}

export type {ModalProps, ProductModalProps, PriceModalProps, ProductDTO, PriceDTO, PriceType, ProductType}