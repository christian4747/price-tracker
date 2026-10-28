import type { PriceType } from '@/types/price'
import { getUSDateStringFromTimestamp } from '@/utils/dateUtils'
import { Button, Center, Modal } from '@mantine/core'
import { useDeletePrice } from '@/hooks/price/useDeletePrice'
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
        mutation.mutate()
        closeDeletePrice()
        e.stopPropagation()
    }

    const priceStartedString = price?.priceStarted ? getUSDateStringFromTimestamp(price.priceStarted) : ''
    const priceAmountString = price?.amount ? getPriceString(price) : 0

    return (
        <>
            <Modal title="Delete Price" opened={opened} onClose={closeDeletePrice} onClick={(e) => e.stopPropagation()}>
                <Center className="flex flex-col">
                    <div className="text-xl mb-2 text-center">
                        Are you sure you want to delete Price {priceStartedString} ({priceAmountString})?
                    </div>

                    <div className="mb-2 text-center">You can restore it later by showing deleted prices.</div>
                </Center>

                <Button fullWidth className="mt-5" onClick={finalizeDeletePrice}>
                    Delete Price
                </Button>
            </Modal>
        </>
    )
}
