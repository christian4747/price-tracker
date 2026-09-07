import type { PriceType } from "../../../utils/Types"
import { Modal } from "@mantine/core"
import PriceCalculator from "../price/PriceCalculator"
import { EditPriceForm } from "../forms/EditPriceForm"

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
            >
                <PriceCalculator />
                <EditPriceForm
                    price={price}
                    closeEditPrice={closeEditPrice}
                />
            </Modal>
        </>
    )
}