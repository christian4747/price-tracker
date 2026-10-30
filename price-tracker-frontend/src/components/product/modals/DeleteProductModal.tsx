import type { ProductType } from '@/types/product'
import { Center } from '@mantine/core'
import { useDeleteProduct } from '@/hooks/product/useDeleteProduct'
import { SaveModal } from '@/components/common/SaveModal'
import { SubmitButton } from '@/components/common/SubmitButton'

type DeleteProductModalProps = {
    product: ProductType
    closeDeleteProduct: () => void
    opened: boolean
}

const DeleteProductModal = ({ product, closeDeleteProduct, opened }: DeleteProductModalProps) => {
    // Hook for deleting products
    const { mutation } = useDeleteProduct(product)

    const finalizeDeleteProduct = (e: React.MouseEvent) => {
        mutation.mutate(undefined, { onSuccess: closeDeleteProduct })
        e.stopPropagation()
    }

    return (
        <>
            <SaveModal
                pending={mutation.isPending}
                title="Delete Product"
                opened={opened}
                onClose={closeDeleteProduct}
                onClick={(e) => e.stopPropagation()}
            >
                <Center className="flex flex-col">
                    <div className="text-xl mb-2 text-center">
                        Are you sure you want to delete Product {product?.name ? product.name : ''}?
                    </div>

                    <div className="mb-2 text-center">You can restore it later by showing deleted products.</div>
                </Center>

                <SubmitButton pending={mutation.isPending} onClick={finalizeDeleteProduct}>
                    Delete Product
                </SubmitButton>
            </SaveModal>
        </>
    )
}

export default DeleteProductModal
