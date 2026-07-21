import Button from "../../common/Button"
import Input from "../../common/Input"
import Modal from "../../common/Modal"
import type { ModalProps, ProductDTO, ProductType } from "../../../utils/Types";

type EditPriceModalProps = ModalProps & {
    editProduct: (product: ProductType, productDTO: ProductDTO) => Promise<void>,
    productDTO: ProductDTO,
    setProductDTO: React.Dispatch<React.SetStateAction<ProductDTO>>
}

const EditProductModal = ({hidden, toggleHidden, editProduct, productDTO, setProductDTO}: EditPriceModalProps) => {
    return (
        <Modal
            hidden={hidden}
        >
            <div className="text-4xl font-mono font-bold flex justify-center">Edit Product</div>
            <Input
                placeholder="Name"
                value={productDTO.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setProductDTO(prev => ({...prev, name: e.target.value}))}}
            />
            <Input
                placeholder="Store"
                value={productDTO.store}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setProductDTO(prev => ({...prev, store: e.target.value}))}}
            />
            <Input
                placeholder="Link"
                value={productDTO.link}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setProductDTO(prev => ({...prev, store: e.target.value}))}}
            />
            <Input className="hidden" placeholder="Initial Price"></Input>
            <div className="flex gap-2 justify-center">
                <Button onClick={editProduct}>Save</Button>
                <Button onClick={toggleHidden}>Cancel</Button>
            </div>
        </Modal>
    )
}

export default EditProductModal