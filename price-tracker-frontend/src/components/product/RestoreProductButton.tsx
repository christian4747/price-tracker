import { useRestoreProduct } from '@/hooks/product/useRestoreProduct'
import type { ProductType } from '@/types/product'
import { Tooltip } from '@mantine/core'
import { MdUndo } from 'react-icons/md'

interface RestoreProductButton {
    product: ProductType
}

export const RestoreProductButton = ({ product }: RestoreProductButton) => {
    // Hook for restoring deleted products
    const { mutation } = useRestoreProduct(product)

    return (
        <div
            className="cursor-pointer"
            role="img"
            aria-label="Restore product"
            onClick={(e) => {
                if (!mutation.isPending) mutation.mutate()
                e.stopPropagation()
            }}
        >
            <Tooltip withArrow label="Restore Product">
                <MdUndo />
            </Tooltip>
        </div>
    )
}
