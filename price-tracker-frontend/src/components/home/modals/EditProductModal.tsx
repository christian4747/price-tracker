
import type { ProductType } from "../../../utils/Types";
import { Button, Modal, Switch, TextInput } from "@mantine/core";
import { useEditProduct } from "@/hooks/product/useEditProduct";

interface EditProductModal {
    product: ProductType
    showOnHover?: boolean
    onEdit?: () => void
    closeEditProduct: () => void
    opened: boolean
}

export const EditProductModal = ({ product, onEdit, closeEditProduct, opened }: EditProductModal) => {

    // Hook for editing products
    const { productDTO, mutation } = useEditProduct(product)

    const finalizeEditProduct = (e: React.MouseEvent) => {
        mutation.mutate()
        onEdit && onEdit()
        closeEditProduct()
        e.stopPropagation()
    }

    return (
        <>
            <Modal
                title="Edit Product"
                opened={opened}
                onClose={closeEditProduct}
                onClick={(e) => e.stopPropagation()}
            >
                <TextInput
                    label="Name"
                    placeholder="Name"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { productDTO.setField('name', e.target.value) }}
                    value={productDTO.value.name}
                    className="mb-2"
                />
                <TextInput
                    label="Store"
                    placeholder="Store"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { productDTO.setField('store', e.target.value) }}
                    value={productDTO.value.store}
                    className="mb-2"
                />
                <TextInput
                    label="Link"
                    placeholder="Link"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { productDTO.setField('link', e.target.value) }}
                    value={productDTO.value.link}
                    className="mb-2"
                />
                <Switch
                    label='Active'
                    checked={productDTO.value.active}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { productDTO.setField('active', e.target.checked) }}
                />

                {/* <Input className="hidden" placeholder="Initial Price"></Input> */}
                <Button fullWidth className="mt-5" onClick={finalizeEditProduct}>Edit Product</Button>
            </Modal>
        </>
    )
}