import Button from "../common/Button"
import Input from "../common/Input"
import Modal from "../common/Modal"
import type { ModalSettings } from "../../App";

type Props = {
    hidden: boolean,
    setModalSettings: React.Dispatch<React.SetStateAction<ModalSettings>>
}

const AddPriceModal = (props: Props) => {
    return (
        <Modal
            hidden={props.hidden}
        >
            <div className="text-4xl font-mono font-bold flex justify-center">Add Price</div>
            <Input placeholder="Price"></Input>
            <Input placeholder="Currency"></Input>
            <Input placeholder="Start Date"></Input>
            <div className="flex gap-2 justify-center">
                <Button>Save</Button>
                <Button onClick={() => {props.setModalSettings(prev => ({...prev, addPriceHidden: !prev.addPriceHidden}))}}>Cancel</Button>
            </div>
        </Modal>
    )
}

export default AddPriceModal