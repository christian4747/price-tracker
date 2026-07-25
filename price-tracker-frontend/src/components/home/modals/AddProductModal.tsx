import Button from "../../common/Button"
import Input from "../../common/Input"
import Modal from "../../common/Modal"
import type { ModalProps, ProductDTO } from "../../../utils/Types";

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
            <div className="text-4xl font-mono font-bold flex justify-center">Add Product</div>
            <Input
                placeholder="Name"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setProductDTO(prev => ({...prev, name: e.target.value}))}}
                value={product.name}
            />
            <Input 
                placeholder="Link"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setProductDTO(prev => ({...prev, link: e.target.value}))}}
                value={product.link}
            />
            <Input
                placeholder="Store"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setProductDTO(prev => ({...prev, store: e.target.value}))}}
                value={product.store}
            />
            <Input
                className="hidden"
                placeholder="Initial Price"
            />
            <div className="flex gap-2 justify-center">
                <Button onClick={addProduct}>Save</Button>
                <Button onClick={toggleHidden}>Cancel</Button>
            </div>
        </Modal>
    )
}

export default AddProductModal