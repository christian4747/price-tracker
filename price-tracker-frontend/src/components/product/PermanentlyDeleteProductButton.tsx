import type { ProductType } from '@/types/product'
import { Tooltip } from '@mantine/core'
import { useContext } from 'react'
import { MdDeleteForever } from 'react-icons/md'
import { PermanentlyDeleteProductContext } from './ProductContext'

interface PermanentlyDeleteProductButton {
    product: ProductType
}

export const PermanentlyDeleteProductButton = ({ product }: PermanentlyDeleteProductButton) => {
    const openPermanentlyDeleteProductModal = useContext(PermanentlyDeleteProductContext)

    return (
        <div
            className="cursor-pointer"
            role="img"
            aria-label="Permanently delete product"
            onClick={(e) => {
                openPermanentlyDeleteProductModal(product)
                e.stopPropagation()
            }}
        >
            <Tooltip withArrow label="Permanently Delete Product">
                <MdDeleteForever />
            </Tooltip>
        </div>
    )
}
