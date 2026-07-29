import Button from "../../common/Button"
import Input from "../../common/Input"
import Modal from "../../common/Modal"
import type { ModalProps, ProductDTO } from "../../../utils/Types";
import ModalHeader from "../../common/ModalHeader";
import LabeledInput from "../../common/LabeledInput";

type AddProductModalProps = ModalProps & {
    product: ProductDTO,
    addProduct: () => void,
    setProductDTO: React.Dispatch<React.SetStateAction<ProductDTO>>
}

const AddProductModal = ({hidden, toggleHidden, product, addProduct, setProductDTO}: AddProductModalProps) => {
    return (
        <Modal
            hidden={hidden}
        >
            <ModalHeader toggleHidden={toggleHidden}>Add Product</ModalHeader>
            <LabeledInput
                label="Name"
                placeholder="Name"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setProductDTO(prev => ({...prev, name: e.target.value}))}}
                value={product.name}
                required
            />
            <LabeledInput
                label="Store"
                placeholder="Store"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setProductDTO(prev => ({...prev, store: e.target.value}))}}
                value={product.store}
            />
            <LabeledInput
                label="Link"
                placeholder="Link"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setProductDTO(prev => ({...prev, link: e.target.value}))}}
                value={product.link}
            />
            <Input
                className="hidden"
                placeholder="Initial Price"
            />
            <div className="flex gap-2 justify-center">
                <Button className="w-full" onClick={addProduct}>Add Product</Button>
            </div>
        </Modal>
    )
}

export default AddProductModal