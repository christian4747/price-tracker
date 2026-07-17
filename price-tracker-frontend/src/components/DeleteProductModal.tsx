import Button from "./Button"
import Modal from "./Modal"
import type { ModalSettings } from "../App";

type Props = {
    hidden: boolean,
    setModalSettings: React.Dispatch<React.SetStateAction<ModalSettings>>
}

const DeleteProductModal = (props: Props) => {
    return (
        <Modal
            hidden={props.hidden}
        >
            <div className="text-4xl font-mono font-bold flex justify-center">Delete Product?</div>
            <div className="flex gap-2 justify-center">
                <Button>Yes</Button>
                <Button onClick={() => {props.setModalSettings(prev => ({...prev, deleteProductHidden: !prev.deleteProductHidden}))}}>No</Button>
            </div>
        </Modal>
    )
}

export default DeleteProductModal