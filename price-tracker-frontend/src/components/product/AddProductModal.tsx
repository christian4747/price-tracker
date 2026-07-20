import Button from "../common/Button"
import Input from "../common/Input"
import Modal from "../common/Modal"
import axios from "axios";
import { useState } from "react";
import api from "../../services/api"
import type { ModalProps, ProductDTO } from "../../utils/Types";

type AddProductModalProps = ModalProps & {
    getAllProducts: () => void
}

const AddProductModal = ({hidden, toggleHidden, getAllProducts}: AddProductModalProps) => {

    const [productToAdd, setProductToAdd] = useState<ProductDTO>({name: '', link: '', store: ''})

    const addProduct = async () => {
        await axios.post(api.getRootUrl() + "/products", productToAdd)
        .then((res) => {
            toggleHidden()
            getAllProducts()
            console.log(res)
        })
        .catch((err) => {
            console.log(`Error occurred while adding ${productToAdd.name}`)
            console.log(err)
        })
    }

    return (
        <Modal
            hidden={hidden}
        >
            <div className="text-4xl font-mono font-bold flex justify-center">Add Product</div>
            <Input placeholder="Name" onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setProductToAdd(prev => ({...prev, name: e.target.value}))}}></Input>
            <Input placeholder="Link" onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setProductToAdd(prev => ({...prev, link: e.target.value}))}}></Input>
            <Input placeholder="Store" onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setProductToAdd(prev => ({...prev, store: e.target.value}))}}></Input>
            <Input className="hidden" placeholder="Initial Price"></Input>
            <div className="flex gap-2 justify-center">
                <Button onClick={addProduct}>Save</Button>
                <Button onClick={toggleHidden}>Cancel</Button>
            </div>
        </Modal>
    )
}

export default AddProductModal