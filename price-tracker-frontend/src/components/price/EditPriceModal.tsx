import Button from "../common/Button"
import Input from "../common/Input"
import Modal from "../common/Modal"
import type { ModalProps, PriceDTO } from "../../utils/Types";
import { useState } from "react";
import axios from "axios";
import api from "../../services/api";
import type { PriceType, ProductType } from "../../App";

type EditPriceModalProps = ModalProps & {
    productId: number,
    price: PriceType,
    setProduct: React.Dispatch<React.SetStateAction<ProductType>>
}

const EditPriceModal = ({hidden, toggleHidden, productId, price, setProduct}: EditPriceModalProps) => {

    const [priceDTO, setPriceDTO] = useState<PriceDTO>(
        {amount: parseFloat(price.amount), currency: price.currency || '', priceStarted: price.priceStarted || '', priceEnded: price.priceEnded || '', productId: productId}
    )

    const editPrice = async () => {
        await axios.put(api.getRootUrl() + "/prices/" + price.priceId.toString(), priceDTO)
            .then((res) => {
                setProduct((prev) => {
                    const idx = prev.prices.indexOf(price)
                    const prices = prev.prices.map((p, i) => {
                        if (i === idx) {
                            p.amount = priceDTO.amount.toString()
                            p.priceStarted = priceDTO.priceStarted.toString()
                            p.priceEnded = priceDTO.priceEnded.toString()
                        }
                        return p
                    })

                    return ({...prev, prices: prices})
                })
                toggleHidden()
                console.log(res)
            })
            .catch((err) => {
                console.log('Error occurred while updating price')
                console.log(err)
            })
    }

    return (
        <Modal
            hidden={hidden}
        >
            <div className="text-4xl font-mono font-bold flex justify-center">Edit Price</div>
            <Input
                placeholder="Price"
                value={priceDTO.amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPriceDTO(prev => ({...prev, amount: parseFloat(e.target.value)}))}}
            />
            <Input placeholder="Currency"
                value={priceDTO.currency}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPriceDTO(prev => ({...prev, currency: e.target.value}))}}
            />
            <Input placeholder="Start Date"
                type="datetime-local"
                value={priceDTO.priceStarted}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPriceDTO(prev => ({...prev, priceStarted: e.target.value}))}}
            />
            <Input placeholder="End Date"
                type="datetime-local"
                value={priceDTO.priceEnded}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPriceDTO(prev => ({...prev, priceEnded: e.target.value}))}}
            />
            <div className="flex gap-2 justify-center">
                <Button onClick={editPrice}>Save</Button>
                <Button onClick={toggleHidden}>Cancel</Button>
            </div>
        </Modal>
    )
}

export default EditPriceModal