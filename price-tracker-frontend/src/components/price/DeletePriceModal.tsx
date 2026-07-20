import Button from "../common/Button"
import Modal from "../common/Modal"
import type { PriceModalProps } from "../../utils/Types";
import axios from "axios";
import api from "../../services/api";
import type { ProductType } from "../../App";

type DeletePriceModalProps = PriceModalProps & {
    setProduct: React.Dispatch<React.SetStateAction<ProductType>>
}

const DeletePriceModal = ({hidden, toggleHidden, price, setProduct}: DeletePriceModalProps) => {

    const deletePrice = async () => {
        await axios.delete(api.getRootUrl() + "/prices/" + price.priceId)
        .then((res) => {
            toggleHidden()
            setProduct((prev) => ({...prev, prices: prev.prices.filter((p) => p != price)}))
            console.log(res)
        })
        .catch((err) => {
            console.log(`Error occurred while deleting ${price.priceId}: ${price.amount} ${price.priceStarted}`)
            console.log(err)
        })
    }

    return (
        <Modal
            hidden={hidden}
        >
            <div className="text-4xl font-mono font-bold flex justify-center">Delete Price {price.amount}?</div>
            <div className="flex gap-2 justify-center">
                <Button onClick={deletePrice}>Yes</Button>
                <Button onClick={toggleHidden}>No</Button>
            </div>
        </Modal>
    )
}

export default DeletePriceModal