
import type { ProductType } from "../../../utils/Types";
import { Button, Center, Modal } from "@mantine/core";
import { useDeleteProduct } from "@/hooks/product/useDeleteProduct";

type DeleteProductModalProps = {
    product: ProductType
    onDelete?: () => void
    closeDeleteProduct: () => void
    opened: boolean
}

const DeleteProductModal = ({ product, onDelete, closeDeleteProduct, opened }: DeleteProductModalProps) => {

    // Hook for deleting products
    const { mutation } = useDeleteProduct(product)

    const finalizeDeleteProduct = (e: React.MouseEvent) => {
        mutation.mutate()
        onDelete && onDelete()
        closeDeleteProduct()
        e.stopPropagation()
    }

    return (
        <>
            <Modal
                title="Delete Product"
                opened={opened}
                onClose={closeDeleteProduct}
                onClick={(e) => e.stopPropagation()}
            >
                <Center className="flex flex-col">
                    <div className="text-xl mb-2 text-center">
                        Are you sure you want to delete Product {product?.name}?
                    </div>

                    <div className="text-xl text-red-600 font-bold mb-2">
                        This cannot be undone.
                    </div>
                </Center>

                <Button fullWidth className="mt-5" onClick={finalizeDeleteProduct}>Delete Product</Button>
            </Modal>
        </>
    )
}

export default DeleteProductModal