import { Button, Switch, TextInput } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useAddProduct } from '@/hooks/product/useAddProduct'
import { useRecentBrands } from '@/hooks/product/useRecentBrands'
import { useRecentStores } from '@/hooks/product/useRecentStores'
import { useRequiredProductFields } from '@/hooks/product/useRequiredProductFields'
import { RecentDataScroller } from '@/components/common/RecentDataScroller'
import { SaveModal } from '@/components/common/SaveModal'
import { SubmitButton } from '@/components/common/SubmitButton'

const AddProductModal = () => {
    // Track state of modal open/close
    const [opened, { open, close }] = useDisclosure(false)

    // Hook for adding products
    const { productDTO, mutation } = useAddProduct()
    // Name and store are needed to save a product
    const { nameError, storeError, checkRequiredFields, resetRequiredFields } = useRequiredProductFields(
        productDTO.value
    )
    // Hooks for recent brands and stores, only fetched while the modal is open
    const { query: recentBrandsQuery } = useRecentBrands(opened)
    const { query: recentStoresQuery } = useRecentStores(opened)

    const recentBrands = recentBrandsQuery.data?.map((brand: string, idx: number) => (
        <Button key={idx} onClick={() => productDTO.setField('brand', brand)}>
            {brand}
        </Button>
    ))

    const recentStores = recentStoresQuery.data?.map((store: string, idx: number) => (
        <Button key={idx} onClick={() => productDTO.setField('store', store)}>
            {store}
        </Button>
    ))

    // Hides any messages, so the modal doesn't reopen with them
    const closeModal = () => {
        resetRequiredFields()
        close()
    }

    const finalizeAddProduct = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!checkRequiredFields()) return

        mutation.mutate(undefined, {
            onSuccess: () => {
                closeModal()
                productDTO.reset()
            }
        })
    }

    return (
        <>
            <SaveModal pending={mutation.isPending} opened={opened} onClose={closeModal} title="Add Product">
                <TextInput
                    label="Name"
                    placeholder="Name"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        productDTO.setField('name', e.target.value)
                    }}
                    value={productDTO.value.name}
                    required
                    error={nameError}
                    className="mb-2"
                />
                <TextInput
                    label="Store"
                    placeholder="Store"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        productDTO.setField('store', e.target.value)
                    }}
                    value={productDTO.value.store}
                    required
                    error={storeError}
                    className="mb-2"
                />
                {recentStores && recentStores.length > 0 && (
                    <RecentDataScroller className="mb-2">{recentStores}</RecentDataScroller>
                )}
                <TextInput
                    label="Brand"
                    placeholder="Brand"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        productDTO.setField('brand', e.target.value)
                    }}
                    value={productDTO.value.brand ?? ''}
                    className="mb-2"
                />
                {recentBrands && recentBrands.length > 0 && (
                    <RecentDataScroller className="mb-2">{recentBrands}</RecentDataScroller>
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
            </SaveModal>
            <Button className="m-2" onClick={open}>
                Add Product
            </Button>
        </>
    )
}

export default AddProductModal
