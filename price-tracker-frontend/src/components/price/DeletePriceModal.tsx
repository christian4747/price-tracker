import Button from "../common/Button"
import Modal from "../common/Modal"
import type { PriceModalProps, ProductType } from "../../utils/Types";

type DeletePriceModalProps = PriceModalProps & {
    setProduct: React.Dispatch<React.SetStateAction<ProductType>>,
    deletePrice: () => any
}

const DeletePriceModal = ({hidden, toggleHidden, price, deletePrice}: DeletePriceModalProps) => {
    return (
        <Modal
            hidden={hidden}
        >
            <div className="text-4xl font-mono font-bold flex justify-center">Delete Price {price.amount}?</div>
            <div className="flex gap-2 justify-center">
                <Button onClick={deletePrice}>Yes</Button>
                <Button onClick={toggleHidden}>No</Button>
            </div>
        </Modal>
    )
}

export default DeletePriceModal