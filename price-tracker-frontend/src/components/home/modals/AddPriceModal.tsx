import Button from "../../common/Button"
import Modal from "../../common/Modal"
import type { PriceDTO, ProductModalProps } from "../../../utils/Types";
import LabeledInput from "../../common/LabeledInput";
import ModalHeader from "../../common/ModalHeader";

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
            <ModalHeader toggleHidden={toggleHidden}>Add Price</ModalHeader>
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
            <Button className="w-full" onClick={addPrice}>Add Price</Button>
        </Modal>
    )
}

export default AddPriceModal