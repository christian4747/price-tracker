
import type { ProductType } from "../../../utils/Types";
import { Button, Modal, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEditProduct } from "@/hooks/product/useEditProduct";
import { MdEdit } from "react-icons/md";

type EditPriceModalProps = {
    product: ProductType
}

const EditProductModal = ({product}: EditPriceModalProps) => {

    // Track state of modal open/close
    const [opened, { open, close }] = useDisclosure(false)

    // Hook for editing products
    const { productDTO, mutation } = useEditProduct(product)

    return (
        <>
            <Modal
                title="Edit Product"
                opened={opened}
                onClose={close}
                onClick={(e) => e.stopPropagation()}
            >
                <TextInput
                    label="Name"
                    placeholder="Name"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {productDTO.setProductDTO(prev => ({...prev, name: e.target.value}))}}
                    value={productDTO.value.name}
                    className="mb-2"
                />
                <TextInput
                    label="Store"
                    placeholder="Store"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {productDTO.setProductDTO(prev => ({...prev, store: e.target.value}))}}
                    value={productDTO.value.store}
                    className="mb-2"
                />
                <TextInput
                    label="Link"
                    placeholder="Link"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {productDTO.setProductDTO(prev => ({...prev, link: e.target.value}))}}
                    value={productDTO.value.link}
                    className="mb-2"
                />

                {/* <Input className="hidden" placeholder="Initial Price"></Input> */}
                <Button fullWidth className="mt-5" onClick={(e) => {mutation.mutate();close();e.stopPropagation()}}>Edit Product</Button>
            </Modal>
            <div
                className="hidden group-hover:block cursor-pointer"
                onClick={(e) => {
                    open()
                    e.stopPropagation()
                }}
            >
                <MdEdit />
            </div>
        </>
    )
}

export default EditProductModal