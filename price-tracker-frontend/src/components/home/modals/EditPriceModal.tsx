import Button from "../../common/Button"
import Input from "../../common/Input"
import Modal from "../../common/Modal"
import type { ModalProps, PriceDTO } from "../../../utils/Types";

type EditPriceModalProps = ModalProps & {
    editPrice: () => Promise<void>,
    priceDTO: PriceDTO,
    setPriceDTO: React.Dispatch<React.SetStateAction<PriceDTO>>
}

const EditPriceModal = ({hidden, toggleHidden, editPrice, priceDTO, setPriceDTO }: EditPriceModalProps) => {
    return (
        <Modal
            hidden={hidden}
        >
            <div className="text-4xl font-mono font-bold flex justify-center">Edit Price</div>
            <Input
                placeholder="Price"
                value={priceDTO.amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPriceDTO(prev => ({...prev, amount: parseFloat(e.target.value)}))}}
                type="number"
                step=".01"
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