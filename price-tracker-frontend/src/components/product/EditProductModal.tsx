import Button from "../common/Button"
import Input from "../common/Input"
import Modal from "../common/Modal"
import { useState } from "react";
import type { ProductDTO, ProductModalProps } from "../../utils/Types";
import axios from "axios";
import api from "../../services/api";

const EditProductModal = ({hidden, toggleHidden, product}: ProductModalProps) => {
    const [productDTO, setProductDTO] = useState<ProductDTO>({
        name: product.name,
        store: product.store,
        link: product.link
    })

    const editProduct = async () => {
        await axios.put(api.getRootUrl() + "/products/" + product.productId.toString(), productDTO)
            .then((res) => {
                product.name = productDTO.name
                product.store = productDTO.store
                product.link = productDTO.link

                toggleHidden()
                console.log(res)
            })
            .catch((err) => {
                console.log(`Error occurred while updating ${product.productId}: ${product.name}`)
                console.log(err)
            })
    }
    

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