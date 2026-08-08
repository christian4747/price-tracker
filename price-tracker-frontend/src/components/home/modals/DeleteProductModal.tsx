
import type { ProductType } from "../../../utils/Types";
import { useDisclosure } from "@mantine/hooks";
import { Button, Center, Modal } from "@mantine/core";
import { useDeleteProduct } from "@/hooks/product/useDeleteProduct";
import { MdDelete } from "react-icons/md";

type DeleteProductModalProps = {
    product: ProductType
}

const DeleteProductModal = ({product}: DeleteProductModalProps) => {

    // Track state of modal open/close
    const [opened, { open, close }] = useDisclosure(false)

    // Hook for deleting products
    const { mutation } = useDeleteProduct(product)

    return (
        <>
            <Modal
                title="Delete Product"
                opened={opened}
                onClose={close}
                onClick={(e) => e.stopPropagation()}
            >
                <Center className="flex flex-col">
                    <div className="text-xl mb-2 text-center">
                        Are you sure you want to delete Product {product.name}?
                    </div>

                    <div className="text-xl text-red-600 font-bold mb-2">
                        This cannot be undone.
                    </div>
                </Center>

                <Button fullWidth className="mt-5" onClick={(e) => {mutation.mutate();close();e.stopPropagation()}}>Delete Product</Button>
            </Modal>
            <div
                className="hidden group-hover:block cursor-pointer"
                onClick={(e) => {
                    open()
                    e.stopPropagation()
                }}
            >
                <MdDelete />
            </div>
        </>
    )
}

export default DeleteProductModal