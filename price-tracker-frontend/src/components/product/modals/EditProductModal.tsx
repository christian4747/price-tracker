import type { ProductType } from '@/types/product'
import { Button, Modal, Switch, TextInput } from '@mantine/core'
import { useEditProduct } from '@/hooks/product/useEditProduct'
import { useRecentStores } from '@/hooks/product/useRecentStores'
import { RecentDataScroller } from '@/components/common/RecentDataScroller'
import { AddedUpdatedText } from '@/components/common/AddedUpdatedText'

interface EditProductModal {
    product: ProductType
    showOnHover?: boolean
    closeEditProduct: () => void
    opened: boolean
}

export const EditProductModal = ({ product, closeEditProduct, opened }: EditProductModal) => {
    // Hook for editing products
    const { productDTO, mutation } = useEditProduct(product)
    // Hook for recent stores, only fetched while the modal is open
    const { query: recentStoresQuery } = useRecentStores(opened)

    const recentStores = recentStoresQuery.data?.map((store: string, idx: number) => (
        <Button key={idx} onClick={() => productDTO.setField('store', store)}>
            {store}
        </Button>
    ))

    const finalizeEditProduct = (e: React.MouseEvent) => {
        mutation.mutate()
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
                // No bottom padding so the dates sit right under the title
                styles={{ header: { paddingBottom: 0 } }}
            >
                {/* In the body rather than the title, so the header's close button stays level with the title */}
                {product && (
                    <AddedUpdatedText
                        createdAt={product.createdAt}
                        updatedAt={product.updatedAt}
                        stacked
                        className="block mb-2"
                    />
                )}
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

                <Button fullWidth className="mt-5" onClick={finalizeEditProduct}>
                    Edit Product
                </Button>
            </Modal>
        </>
    )
}
