import type { PriceType } from '@/types/price'
import { getUSDateStringFromTimestamp } from '@/utils/dateUtils'
import { Center } from '@mantine/core'
import { usePermanentlyDeletePrice } from '@/hooks/price/usePermanentlyDeletePrice'
import { SaveModal } from '@/components/common/SaveModal'
import { SubmitButton } from '@/components/common/SubmitButton'
import { getPriceString } from '@/utils/priceUtils'

interface PermanentlyDeletePriceModal {
    price: PriceType
    closeModal: () => void
    opened: boolean
}

export const PermanentlyDeletePriceModal = ({ price, closeModal, opened }: PermanentlyDeletePriceModal) => {
    // Hook for permanently deleting prices
    const { mutation } = usePermanentlyDeletePrice(price)

    const finalizeDeletePrice = (e: React.MouseEvent) => {
        mutation.mutate(undefined, { onSuccess: closeModal })
        e.stopPropagation()
    }

    const priceStartedString = price?.priceStarted ? getUSDateStringFromTimestamp(price.priceStarted) : ''
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
