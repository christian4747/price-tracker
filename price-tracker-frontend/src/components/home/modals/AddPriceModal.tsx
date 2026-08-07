
import { Button, Modal } from "@mantine/core";
import type { ProductType } from "@/utils/Types";
import LabeledInput from "components/common/LabeledInput";
import { useDisclosure } from "@mantine/hooks";
import { useAddPrice } from "@/hooks/price/useAddPrice";
import { javaTimestampToJS } from "@/utils/DateUtilities";
import { getHighestPrice } from "@/utils/PriceUtilities";

type AddPriceModalProps = {
    product: ProductType
}

const AddPriceModal = ({ product }: AddPriceModalProps) => {

    const [opened, { open, close }] = useDisclosure(false)

    // Hook for adding prices
    const { priceDTO, mutation } = useAddPrice(product, getHighestPrice(product?.prices))

    const openAddPriceModal = () => {
        priceDTO.setPriceDTO(prev => ({...prev, priceStarted: javaTimestampToJS(new Date(Date.now()).toISOString())}))
        open()
    }

    return (
        <>
            <Modal
                opened={opened}
                onClose={close}
                title="Add Price"
                removeScrollProps={{ enabled: false }}
            >
                <LabeledInput
                    label="Price"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {priceDTO.setPriceDTO(prev => ({...prev, amount: e.target.value}))}}
                    value={priceDTO.value.amount}
                    type="number"
                    step=".01"
                    required
                />
                <LabeledInput
                    label="Description"
                    placeholder="Description"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {priceDTO.setPriceDTO(prev => ({...prev, description: e.target.value}))}}
                    value={priceDTO.value.description}
                />
                {/* <Input
                    placeholder="Currency"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setPriceDTO(prev => ({...prev, currency: e.target.value}))}}
                    value={priceDTO.currency}
                /> */}
                <LabeledInput
                    label="Start Date"
                    placeholder="Start Date"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {priceDTO.setPriceDTO(prev => ({...prev, priceStarted: e.target.value}))}}
                    value={priceDTO.value.priceStarted}
                    type="datetime-local"
                    required
                />
                <LabeledInput
                    label="End Date"
                    placeholder="End Date"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {priceDTO.setPriceDTO(prev => ({...prev, priceEnded: e.target.value}))}}
                    value={priceDTO.value.priceEnded}
                    type="datetime-local"
                />
                <Button
                    className="mt-5"
                    fullWidth
                    onClick={
                        () => {
                            mutation.mutate()
                            close()
                        }
                    }
                >
                    Add Price
                </Button>
            </Modal>
            <Button className="m-2" onClick={openAddPriceModal}>Add Price</Button>
        </>
    )
}

export default AddPriceModal