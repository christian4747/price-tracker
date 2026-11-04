import type { PriceType } from '@/types/price'
import { useIsMutating } from '@tanstack/react-query'
import { EditPriceForm } from '@/components/price/forms/EditPriceForm'
import { AddedUpdatedText } from '@/components/common/AddedUpdatedText'
import { SaveModal } from '@/components/common/SaveModal'
import { getEditPriceMutationKey } from '@/hooks/price/useEditPrice'

interface EditPriceModal {
    price: PriceType
    // Passed separately because the API's prices leave out their product
    productId: number
    closeEditPrice: () => void
    opened: boolean
}

export const EditPriceModal = ({ price, productId, closeEditPrice, opened }: EditPriceModal) => {
    // The save runs in the form, so check for it by its key
    const saving = useIsMutating({ mutationKey: getEditPriceMutationKey(price?.priceId) }) > 0

    return (
        <>
            <SaveModal
                pending={saving}
                opened={opened}
                onClose={closeEditPrice}
                title="Edit Price"
                // No bottom padding so the dates sit right under the title
                styles={{ header: { paddingBottom: 0 } }}
            >
                {/* In the body rather than the title, so the header's close button stays level with the title */}
                {price && (
                    <AddedUpdatedText
                        createdAt={price.createdAt}
                        updatedAt={price.updatedAt}
                        stacked
                        className="block mb-2"
                    />
                )}
                <EditPriceForm price={price} productId={productId} closeEditPrice={closeEditPrice} />
            </SaveModal>
        </>
    )
}
