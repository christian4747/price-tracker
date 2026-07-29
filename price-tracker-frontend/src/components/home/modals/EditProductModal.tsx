import Button from "../../common/Button"
import Input from "../../common/Input"
import Modal from "../../common/Modal"
import type { ModalProps, ProductDTO } from "../../../utils/Types";
import ModalHeader from "../../common/ModalHeader";
import LabeledInput from "../../common/LabeledInput";

type EditPriceModalProps = ModalProps & {
    editProduct: () => void,
    productDTO: ProductDTO,
    setProductDTO: React.Dispatch<React.SetStateAction<ProductDTO>>
}

const EditProductModal = ({hidden, toggleHidden, editProduct, productDTO, setProductDTO}: EditPriceModalProps) => {
    return (
        <Modal
            hidden={hidden}
        >
            <ModalHeader toggleHidden={toggleHidden}>Edit Product</ModalHeader>
            <LabeledInput
                label="Name"
                placeholder="Name"
                value={productDTO.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setProductDTO(prev => ({...prev, name: e.target.value}))}}
                required
            />
            <LabeledInput
                label="Store"
                placeholder="Store"
                value={productDTO.store}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setProductDTO(prev => ({...prev, store: e.target.value}))}}
            />
            <LabeledInput
                label="Link"
                placeholder="Link"
                value={productDTO.link}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setProductDTO(prev => ({...prev, link: e.target.value}))}}
            />
            <Input className="hidden" placeholder="Initial Price"></Input>
            <Button className="w-full" onClick={editProduct}>Save Product</Button>
        </Modal>
    )
}

export default EditProductModal