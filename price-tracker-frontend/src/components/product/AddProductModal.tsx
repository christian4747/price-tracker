import Button from "../common/Button"
import Input from "../common/Input"
import Modal from "../common/Modal"
import type { ModalProps, ProductDTO } from "../../utils/Types";

type AddProductModalProps = ModalProps & {
    addProduct: () => void,
    setProductDTO: React.Dispatch<React.SetStateAction<ProductDTO>>
}

const AddProductModal = ({hidden, toggleHidden, addProduct, setProductDTO}: AddProductModalProps) => {
    return (
        <Modal
            hidden={hidden}
        >
            <div className="text-4xl font-mono font-bold flex justify-center">Add Product</div>
            <Input placeholder="Name" onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setProductDTO(prev => ({...prev, name: e.target.value}))}}></Input>
            <Input placeholder="Link" onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setProductDTO(prev => ({...prev, link: e.target.value}))}}></Input>
            <Input placeholder="Store" onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setProductDTO(prev => ({...prev, store: e.target.value}))}}></Input>
            <Input className="hidden" placeholder="Initial Price"></Input>
            <div className="flex gap-2 justify-center">
                <Button onClick={addProduct}>Save</Button>
                <Button onClick={toggleHidden}>Cancel</Button>
            </div>
        </Modal>
    )
}

export default AddProductModal