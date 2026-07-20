import Button from "../common/Button"
import Modal from "../common/Modal"
import type { ProductModalProps } from "../../utils/Types";

type DeleteProductModalProps = ProductModalProps & {
    deleteProduct: () => Promise<void>
}

const DeleteProductModal = ({hidden, toggleHidden, product, deleteProduct}: DeleteProductModalProps) => {
    return (
        <Modal
            hidden={hidden}
        >
            <div className="text-4xl font-mono font-bold flex justify-center">Delete {product.name}?</div>
            <div className="flex gap-2 justify-center">
                <Button onClick={deleteProduct}>Yes</Button>
                <Button onClick={toggleHidden}>No</Button>
            </div>
        </Modal>
    )
}

export default DeleteProductModal