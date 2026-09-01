
import type { PriceType } from "../../../utils/Types";
import { getUSDateStringFromTimestamp } from "../../../utils/DateUtilities";
import { Button, Center, Modal } from "@mantine/core";
import { useDeletePrice } from "@/hooks/price/useDeletePrice";

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

    return (
        <>
            <Modal
                title="Delete Price"
                opened={opened}
                onClose={closeDeletePrice}
                onClick={(e) => e.stopPropagation()}
            >
                <Center className="flex flex-col">
                    <div className="text-xl mb-2 text-center">
                        Are you sure you want to delete Price {getUSDateStringFromTimestamp(price.priceStarted)} (${price.amount})?
                    </div>

                    <div className="text-xl text-red-600 font-bold mb-2">This cannot be undone.</div>
                </Center>

                <Button fullWidth className="mt-5" onClick={finalizeDeletePrice}>Delete Price</Button>
            </Modal>
        </>
    )
}