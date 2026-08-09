
import type { PriceType } from "../../../utils/Types";
import { getUSDateStringFromTimestamp } from "../../../utils/DateUtilities";
import { Button, Center, Modal, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { MdDelete } from "react-icons/md";
import { useDeletePrice } from "@/hooks/price/useDeletePrice";

type DeletePriceModalProps =  {
    price: PriceType
}

const DeletePriceModal = ({price}: DeletePriceModalProps) => {

    // Track state of modal open/close
    const [opened, { open, close }] = useDisclosure(false)

    // Hook for deleting prices
    const { mutation } = useDeletePrice(price)

    return (
        <>
            <Modal
                title="Delete Price"
                opened={opened}
                onClose={close}
                onClick={(e) => e.stopPropagation()}
            >
                <Center className="flex flex-col">
                    <div className="text-xl mb-2 text-center">
                        Are you sure you want to delete Price {getUSDateStringFromTimestamp(price.priceStarted)} (${price.amount})?
                    </div>

                    <div className="text-xl text-red-600 font-bold mb-2">This cannot be undone.</div>
                </Center>

                <Button fullWidth className="mt-5" onClick={(e) => {mutation.mutate();close();e.stopPropagation()}}>Delete Price</Button>
            </Modal>
            <div
                className="hidden group-hover/product:block cursor-pointer"
                onClick={(e) => {
                    open()
                    e.stopPropagation()
                }}
            >
                <Tooltip withArrow label="Delete Price"><MdDelete /></Tooltip>
            </div>
        </>
    )
}

export default DeletePriceModal