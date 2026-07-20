import Button from "../common/Button"
import Input from "../common/Input"
import Modal from "../common/Modal"
import type { PriceDTO, ProductModalProps } from "../../utils/Types";

type AddPriceModalProps = ProductModalProps & {
    priceDTO: PriceDTO,
    setPriceDTO: React.Dispatch<React.SetStateAction<PriceDTO>>,
    addPrice: () => void
}

const AddPriceModal = ({hidden, toggleHidden, addPrice, priceDTO, setPriceDTO}: AddPriceModalProps) => {
    return (
        <Modal
            hidden={hidden}
        >
            <div className="text-4xl font-mono font-bold flex justify-center">Add Price</div>
            <Input
                placeholder="Price"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPriceDTO(prev => ({...prev, amount: parseFloat(e.target.value)}))}}
                value={priceDTO.amount}
            />
            <Input
                placeholder="Currency"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPriceDTO(prev => ({...prev, currency: e.target.value}))}}
                value={priceDTO.currency}
            />
            <Input
                placeholder="Start Date"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPriceDTO(prev => ({...prev, priceStarted: e.target.value}))}}
                value={priceDTO.priceStarted}
                type="datetime-local"
            />
            <Input
                placeholder="End Date"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPriceDTO(prev => ({...prev, priceEnded: e.target.value}))}}
                value={priceDTO.priceEnded}
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