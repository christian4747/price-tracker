
import { Button, Modal} from '@mantine/core'
import type { ProductType } from '@/utils/Types'
import { useDisclosure } from '@mantine/hooks'
import PriceCalculator from '../price/PriceCalculator'
import { AddPriceForm } from '../forms/AddPriceForm'

interface AddPriceModal {
    product: ProductType
    setDateToday: (newVal: Date) => void
}

export const AddPriceModal = ({ product, setDateToday }: AddPriceModal) => {

    // Track state of modal open/close
    const [opened, { open, close }] = useDisclosure(false)

    return (
        <>
            <Modal
                opened={opened}
                onClose={close}
                title="Add Price"
            >
                <PriceCalculator />
                <AddPriceForm product={product} setDateToday={setDateToday} />
            </Modal>
            <Button className="m-2" onClick={open}>Add Price</Button>
        </>
    )
}