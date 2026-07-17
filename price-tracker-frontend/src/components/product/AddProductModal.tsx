import Button from "../common/Button"
import Input from "../common/Input"
import Modal from "../common/Modal"
import type { ModalSettings } from "../../App";

type Props = {
    hidden: boolean,
    setModalSettings: React.Dispatch<React.SetStateAction<ModalSettings>>
}

const AddProductModal = (props: Props) => {
    return (
        <Modal
            hidden={props.hidden}
        >
            <div className="text-4xl font-mono font-bold flex justify-center">Add Product</div>
            <Input placeholder="Name"></Input>
            <Input placeholder="Link"></Input>
            <Input placeholder="Store"></Input>
            <Input placeholder="Initial Price"></Input>
            <div className="flex gap-2 justify-center">
                <Button>Save</Button>
                <Button onClick={() => {props.setModalSettings(prev => ({...prev, addProductHidden: !prev.addProductHidden}))}}>Cancel</Button>
            </div>
        </Modal>
    )
}

export default AddProductModal