import { Button, Modal, Switch, TextInput } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useAddProduct } from '@/hooks/product/useAddProduct'
import { useRecentStores } from '@/hooks/product/useRecentStores'
import { RecentDataScroller } from '@/components/common/RecentDataScroller'
import { SubmitButton } from '@/components/common/SubmitButton'

const AddProductModal = () => {
    // Track state of modal open/close
    const [opened, { open, close }] = useDisclosure(false)

    // Hook for adding products
    const { productDTO, mutation } = useAddProduct()
    // Hook for recent stores, only fetched while the modal is open
    const { query: recentStoresQuery } = useRecentStores(opened)

    const recentStores = recentStoresQuery.data?.map((store: string, idx: number) => (
        <Button key={idx} onClick={() => productDTO.setField('store', store)}>
            {store}
        </Button>
    ))

    const finalizeAddProduct = (e: React.MouseEvent) => {
        mutation.mutate(undefined, {
            onSuccess: () => {
                close()
                productDTO.reset()
            }
        })
        e.stopPropagation()
    }

    return (
        <>
            <Modal opened={opened} onClose={close} title="Add Product">
                <TextInput
                    label="Name"
                    placeholder="Name"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        productDTO.setField('name', e.target.value)
                    }}
                    value={productDTO.value.name}
                    className="mb-2"
                />
                <TextInput
                    label="Store"
                    placeholder="Store"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        productDTO.setField('store', e.target.value)
                    }}
                    value={productDTO.value.store}
                    className="mb-2"
                />
                {recentStores && recentStores.length > 0 && (
                    <RecentDataScroller className="mb-2">{recentStores}</RecentDataScroller>
                )}
                <TextInput
                    label="Link"
                    placeholder="Link"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        productDTO.setField('link', e.target.value)
                    }}
                    value={productDTO.value.link}
                    className="mb-2"
                />
                <Switch
                    label="Active"
                    checked={productDTO.value.active}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        productDTO.setField('active', e.target.checked)
                    }}
                />

                {/* <Input
                    className="hidden"
                    placeholder="Initial Price"
                /> */}
                <SubmitButton pending={mutation.isPending} onClick={finalizeAddProduct}>
                    Add Product
                </SubmitButton>
            </Modal>
            <Button className="m-2" onClick={open}>
                Add Product
            </Button>
        </>
    )
}

export default AddProductModal
