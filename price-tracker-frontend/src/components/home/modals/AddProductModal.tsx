import { Button, Modal, Switch, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useAddProduct } from "@/hooks/product/useAddProduct";

const AddProductModal = () => {

    // Track state of modal open/close
    const [opened, { open, close }] = useDisclosure(false)

    // Hook for adding products
    const { productDTO, mutation } = useAddProduct()

    return (
        <>
            <Modal
                opened={opened}
                onClose={close}
                title="Add Product"
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

                {/* <Input
                    className="hidden"
                    placeholder="Initial Price"
                /> */}
                <Button fullWidth className="mt-5" onClick={(e) => { mutation.mutate(); close(); e.stopPropagation(); productDTO.reset() }}>Add Product</Button>
            </Modal>
            <Button className="m-2" onClick={open}>Add Product</Button>
        </>
    )
}

export default AddProductModal