import Button from "../../common/Button"
import Input from "../../common/Input"
import Modal from "../../common/Modal"
import type { PriceDTO, ProductModalProps } from "../../../utils/Types";
import { MdClose } from "react-icons/md";
import LabeledInput from "../../common/LabeledInput";

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
            <div className="text-4xl font-mono font-bold flex justify-between items-center">
                <div>Add Price</div>
                <div className="cursor-pointer" onClick={toggleHidden}><MdClose/></div>
            </div>
            <LabeledInput
                label="Price"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPriceDTO(prev => ({...prev, amount: e.target.value}))}}
                value={priceDTO.amount}
                type="number"
                step=".01"
                required
            />
            <LabeledInput
                label="Description"
                placeholder="Description"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPriceDTO(prev => ({...prev, description: e.target.value}))}}
                value={priceDTO.description}
            />
            {/* <Input
                placeholder="Currency"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPriceDTO(prev => ({...prev, currency: e.target.value}))}}
                value={priceDTO.currency}
            /> */}
            <LabeledInput
                label="Start Date"
                placeholder="Start Date"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPriceDTO(prev => ({...prev, priceStarted: e.target.value}))}}
                value={priceDTO.priceStarted}
                type="datetime-local"
                required
            />
            <LabeledInput
                label="End Date"
                placeholder="End Date"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPriceDTO(prev => ({...prev, priceEnded: e.target.value}))}}
                value={priceDTO.priceEnded}
                type="datetime-local"
            />
            <div className="flex gap-2 justify-center">
                <Button className="w-full" onClick={addPrice}>Add Price</Button>
            </div>
        </Modal>
    )
}

export default AddPriceModal