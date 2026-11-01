import type { ProductType } from '@/types/product'
import { Center, TextInput } from '@mantine/core'
import { useState } from 'react'
import { usePriceCount } from '@/hooks/price/usePriceCount'
import { usePermanentlyDeleteProduct } from '@/hooks/product/usePermanentlyDeleteProduct'
import { SaveModal } from '@/components/common/SaveModal'
import { SubmitButton } from '@/components/common/SubmitButton'

interface PermanentlyDeleteProductModal {
    product: ProductType
    closeModal: () => void
    opened: boolean
}

const getPriceCountText = (priceCount: number) => {
    if (priceCount === 0) return 'This product has no prices.'
    return `This also permanently deletes its ${priceCount} ${priceCount === 1 ? 'price' : 'prices'}.`
}

export const PermanentlyDeleteProductModal = ({ product, closeModal, opened }: PermanentlyDeleteProductModal) => {
    // Hook for permanently deleting products
    const { mutation } = usePermanentlyDeleteProduct(product)
    // Only counted once the modal is open, since every product list has this modal
    const { query: priceCountQuery } = usePriceCount(product?.productId, opened)
    // The name the user has typed to confirm
    const [typedName, setTypedName] = useState('')

    // A saved count can be out of date while it refetches, so it only counts once the refetch ends
    const priceCount = priceCountQuery.isFetching ? undefined : priceCountQuery.data

    const closeAndClearName = () => {
        setTypedName('')
        closeModal()
    }

    const finalizeDeleteProduct = (e: React.MouseEvent) => {
        mutation.mutate(undefined, { onSuccess: closeAndClearName })
        e.stopPropagation()
    }

    return (
        <>
            <SaveModal
                pending={mutation.isPending}
                title="Permanently Delete Product"
                opened={opened}
                onClose={closeAndClearName}
                onClick={(e) => e.stopPropagation()}
            >
                <Center className="flex flex-col">
                    <div className="text-xl mb-2 text-center">
                        Are you sure you want to permanently delete Product {product?.name}
                        {product?.store && ` at ${product.store}`}?
                    </div>

                    {priceCount !== undefined && (
                        <div className="mb-2 text-center">{getPriceCountText(priceCount)}</div>
                    )}

                    <div className="mb-2 text-center">This can't be undone.</div>
                </Center>

                <TextInput
                    label="Type the product's name to confirm"
                    placeholder={product?.name}
                    value={typedName}
                    onChange={(e) => setTypedName(e.currentTarget.value)}
                />

                <SubmitButton
                    pending={mutation.isPending}
                    disabled={typedName !== product?.name || priceCount === undefined}
                    onClick={finalizeDeleteProduct}
                >
                    Permanently Delete Product
                </SubmitButton>
            </SaveModal>
        </>
    )
}
