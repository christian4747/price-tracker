import Button from "../common/Button"
import Modal from "../common/Modal"
import type { ProductModalProps } from "../../utils/Types";
import axios from "axios";
import api from "../../services/api";

type DeleteProductModalProps = ProductModalProps & {
    setHideProduct: React.Dispatch<React.SetStateAction<boolean>>
}

const DeleteProductModal = ({hidden, toggleHidden, product, setHideProduct}: DeleteProductModalProps) => {

    const deleteProduct = async () => {
        await axios.delete(api.getRootUrl() + "/products/" + product.productId)
        .then((res) => {
            toggleHidden()
            setHideProduct(true)
            console.log(res)
        })
        .catch((err) => {
            console.log(`Error occurred while deleting ${product.productId}: ${product.name}`)
            console.log(err)
        })
    }

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