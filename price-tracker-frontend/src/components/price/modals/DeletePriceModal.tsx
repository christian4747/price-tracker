import type { PriceType } from '@/types/price'
import { getUSDateStringFromTimestamp } from '@/utils/dateUtils'
import { Center } from '@mantine/core'
import { useDeletePrice } from '@/hooks/price/useDeletePrice'
import { SaveModal } from '@/components/common/SaveModal'
import { SubmitButton } from '@/components/common/SubmitButton'
import { getPriceString } from '@/utils/priceUtils'

interface DeletePriceModal {
    price: PriceType
    closeDeletePrice: () => void
    opened: boolean
}

export const DeletePriceModal = ({ price, closeDeletePrice, opened }: DeletePriceModal) => {
    // Hook for deleting prices
    const { mutation } = useDeletePrice(price)

    const finalizeDeletePrice = (e: React.MouseEvent) => {
        mutation.mutate(undefined, { onSuccess: closeDeletePrice })
        e.stopPropagation()
    }

    const priceStartedString = price?.priceStarted ? getUSDateStringFromTimestamp(price.priceStarted) : ''
    const priceAmountString = price?.amount ? getPriceString(price) : 0

    return (
        <>
            <SaveModal
                pending={mutation.isPending}
                title="Delete Price"
                opened={opened}
                onClose={closeDeletePrice}
                onClick={(e) => e.stopPropagation()}
            >
                <Center className="flex flex-col">
                    <div className="text-xl mb-2 text-center">
                        Are you sure you want to delete Price {priceStartedString} ({priceAmountString})?
                    </div>

                    <div className="mb-2 text-center">You can restore it later by showing deleted prices.</div>
                </Center>

                <SubmitButton pending={mutation.isPending} onClick={finalizeDeletePrice}>
                    Delete Price
                </SubmitButton>
            </SaveModal>
        </>
    )
}
