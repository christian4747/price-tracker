import type { PriceType } from '@/types/price'
import { Modal } from '@mantine/core'
import { EditPriceForm } from '@/components/price/forms/EditPriceForm'
import { AddedUpdatedText } from '@/components/common/AddedUpdatedText'

interface EditPriceModal {
    price: PriceType
    closeEditPrice: () => void
    opened: boolean
}

export const EditPriceModal = ({ price, closeEditPrice, opened }: EditPriceModal) => {
    return (
        <>
            <Modal
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
                <EditPriceForm price={price} closeEditPrice={closeEditPrice} />
            </Modal>
        </>
    )
}
