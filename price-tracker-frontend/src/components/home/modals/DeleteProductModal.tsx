import Button from "../../common/Button"
import Modal from "../../common/Modal"
import type { ProductModalProps } from "../../../utils/Types";
import ModalHeader from "../../common/ModalHeader";

type DeleteProductModalProps = ProductModalProps & {
    deleteProduct: () => void
}

const DeleteProductModal = ({hidden, toggleHidden, product, deleteProduct}: DeleteProductModalProps) => {
    return (
        <Modal
            hidden={hidden}
        >
            <ModalHeader toggleHidden={toggleHidden}>Delete Product</ModalHeader>
            <div className="text-xl font-mono flex flex-col">
                Are you sure you want to delete Product {product.name}? <span className="text-red-600">This cannot be undone.</span>
            </div>
            <Button className="w-full" onClick={deleteProduct}>Delete Product</Button>
        </Modal>
    )
}

export default DeleteProductModal