import Button from "../common/Button"
import Input from "../common/Input"
import Modal from "../common/Modal"
import type { PriceDTO, ProductModalProps } from "../../utils/Types";
import axios from "axios";
import api from "../../services/api";
import { useState } from "react";
import type { ProductType } from "../../App";

type AddPriceModalProps = ProductModalProps & {
    setProduct: React.Dispatch<React.SetStateAction<ProductType>>
}

const AddPriceModal = ({hidden, toggleHidden, product, setProduct}: AddPriceModalProps) => {

    const [priceToAdd, setPriceToAdd] = useState<PriceDTO>(
        {amount: 0, currency: '', priceStarted: '', priceEnded: '', productId: product.productId}
    )

    const addPrice = async () => {
        await axios.post(api.getRootUrl() + "/prices", priceToAdd)
        .then((res) => {
            toggleHidden()
            setProduct(prev => ({...prev, prices: [...prev.prices, res.data]}))
            resetPriceToAdd()
            console.log(res)
        })
        .catch((err) => {
            console.log(`Error occurred while adding ${setPriceToAdd.name}`)
            console.log(err)
        })
    }

    const resetPriceToAdd = () => {
        setPriceToAdd({amount: 0, currency: '', priceStarted: '', priceEnded: '', productId: product.productId})
    }

    return (
        <Modal
            hidden={hidden}
        >
            <div className="text-4xl font-mono font-bold flex justify-center">Add Price</div>
            <Input
                placeholder="Price"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPriceToAdd(prev => ({...prev, amount: parseFloat(e.target.value)}))}}
                value={priceToAdd.amount}
            />
            <Input
                placeholder="Currency"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPriceToAdd(prev => ({...prev, currency: e.target.value}))}}
                value={priceToAdd.currency}
            />
            <Input
                placeholder="Start Date"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPriceToAdd(prev => ({...prev, priceStarted: e.target.value}))}}
                value={priceToAdd.priceStarted}
                type="datetime-local"
            />
            <Input
                placeholder="End Date"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPriceToAdd(prev => ({...prev, priceEnded: e.target.value}))}}
                value={priceToAdd.priceEnded}
                type="datetime-local"
            />
            <div className="flex gap-2 justify-center">
                <Button onClick={addPrice}>Save</Button>
                <Button onClick={toggleHidden}>Cancel</Button>
            </div>
        </Modal>
    )
}

export default AddPriceModal