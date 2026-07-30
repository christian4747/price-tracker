import Button from "../../common/Button"
import Modal from "../../common/Modal"
import type { ModalProps, PriceDTO } from "../../../utils/Types";
import ModalHeader from "../../common/ModalHeader";
import LabeledInput from "../../common/LabeledInput";

type EditPriceModalProps = ModalProps & {
    editPrice: () => void,
    priceDTO: PriceDTO,
    setPriceDTO: React.Dispatch<React.SetStateAction<PriceDTO>>
}

const EditPriceModal = ({hidden, toggleHidden, editPrice, priceDTO, setPriceDTO }: EditPriceModalProps) => {
    return (
        <Modal
            hidden={hidden}
        >
            <ModalHeader toggleHidden={toggleHidden}>Edit Price</ModalHeader>
            <LabeledInput
                label="Price"
                value={priceDTO.amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPriceDTO(prev => ({...prev, amount: e.target.value}))}}
                type="number"
                step=".01"
                required
            />
            <LabeledInput
                label="Description"
                placeholder="Description"
                value={priceDTO.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPriceDTO(prev => ({...prev, description: e.target.value}))}}
            />
            {/* <Input placeholder="Currency"
                value={priceDTO.currency}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPriceDTO(prev => ({...prev, currency: e.target.value}))}}
            /> */}
            <LabeledInput
                label="Start Date"
                type="datetime-local"
                value={priceDTO.priceStarted}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPriceDTO(prev => ({...prev, priceStarted: e.target.value}))}}
                required
            />
            <LabeledInput
                label="End Date"
                type="datetime-local"
                value={priceDTO.priceEnded}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPriceDTO(prev => ({...prev, priceEnded: e.target.value}))}}
            />
            <Button className="w-full" onClick={editPrice}>Save Price</Button>
        </Modal>
    )
}

export default EditPriceModal