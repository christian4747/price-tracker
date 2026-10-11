
import { Button, Modal} from '@mantine/core'
import type { ProductType } from '@/utils/Types'
import { useDisclosure } from '@mantine/hooks'
import { AddPriceForm } from '../forms/AddPriceForm'

interface AddPriceModal {
    product: ProductType
    setDateToday: (newVal: Date) => void
    quickAdd?: boolean
}

export const AddPriceModal = ({ product, setDateToday, quickAdd = false }: AddPriceModal) => {

    // Track state of modal open/close
    const [opened, { open, close }] = useDisclosure(false)

    return (
        <>
            <Modal
                opened={opened}
                onClose={close}
                title="Add Price"
            >
                <AddPriceForm product={product} setDateToday={setDateToday} close={close} quickAdd={quickAdd} />
            </Modal>
            <Button className="m-2" onClick={open}>{quickAdd ? "Quick Price" : "Add Price"}</Button>
        </>
    )
}