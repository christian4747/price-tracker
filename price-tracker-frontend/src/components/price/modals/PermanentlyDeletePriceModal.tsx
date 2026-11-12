import type { PriceType } from '@/types/price'
import { getPriceDateString } from '@/utils/priceListUtils'
import { Center } from '@mantine/core'
import { usePermanentlyDeletePrice } from '@/hooks/price/usePermanentlyDeletePrice'
import { SaveModal } from '@/components/common/SaveModal'
import { SubmitButton } from '@/components/common/SubmitButton'
import { getPriceString } from '@/utils/priceUtils'

interface PermanentlyDeletePriceModal {
    price: PriceType
    closeModal: () => void
    opened: boolean
    // Names the price by its start time too, as its row does when another price starts on the same day
    showTime?: boolean
}

/**
 * Asks before permanently deleting a deleted price, naming it the way its row does: its start date, with the time when
 * another price in the list starts on the same day, and its amount. Unlike a delete, this can't be undone.
 */
export const PermanentlyDeletePriceModal = ({
    price,
    closeModal,
    opened,
    showTime = false
}: PermanentlyDeletePriceModal) => {
    // Hook for permanently deleting prices
    const { mutation } = usePermanentlyDeletePrice(price)

    /**
     * Permanently delete the price, and close the confirmation once the delete has worked.
     * @param e The click on the confirm button, stopped so it doesn't also reach the product row behind the modal
     * (React passes events up through a modal's portal to the component that rendered it)
     */
    const finalizeDeletePrice = (e: React.MouseEvent) => {
        mutation.mutate(undefined, { onSuccess: closeModal })
        e.stopPropagation()
    }

    const priceStartedString = price?.priceStarted ? getPriceDateString(price, showTime) : ''
    const priceAmountString = getPriceString(price)

    return (
        <>
            <SaveModal
                pending={mutation.isPending}
                title="Permanently Delete Price"
                opened={opened}
                onClose={closeModal}
                onClick={(e) => e.stopPropagation()}
            >
                <Center className="flex flex-col">
                    <div className="text-xl mb-2 text-center">
                        Are you sure you want to permanently delete Price {priceStartedString} ({priceAmountString})?
                    </div>

                    <div className="mb-2 text-center">This can't be undone.</div>
                </Center>

                <SubmitButton pending={mutation.isPending} onClick={finalizeDeletePrice}>
                    Permanently Delete Price
                </SubmitButton>
            </SaveModal>
        </>
    )
}
