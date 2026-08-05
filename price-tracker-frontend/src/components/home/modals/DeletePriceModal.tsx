import Button from "../../common/Button"
import Modal from "../../common/Modal"
import type { PriceModalProps } from "../../../utils/Types";
import { getUSDateStringFromTimestamp } from "../../../utils/DateUtilities";
import ModalHeader from "../../common/ModalHeader";

type DeletePriceModalProps = PriceModalProps & {
    deletePrice: () => any
}

const DeletePriceModal = ({hidden, toggleHidden, price, deletePrice}: DeletePriceModalProps) => {
    return (
        <Modal
            hidden={hidden}
        >
            <ModalHeader toggleHidden={toggleHidden}>Delete Price</ModalHeader>
            <div className="text-xl flex flex-col">
                Are you sure you want to delete Price {getUSDateStringFromTimestamp(price.priceStarted)} (${price.amount})? <span className="text-red-600 font-bold">This cannot be undone.</span>
            </div>
            <Button className="w-full" onClick={deletePrice}>Delete Price</Button>
        </Modal>
    )
}

export default DeletePriceModal