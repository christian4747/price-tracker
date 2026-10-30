import { Button } from '@mantine/core'
import type { ProductType } from '@/types/product'
import { useDisclosure } from '@mantine/hooks'
import { useIsMutating } from '@tanstack/react-query'
import { AddPriceForm } from '@/components/price/forms/AddPriceForm'
import { SaveModal } from '@/components/common/SaveModal'
import { getAddPriceMutationKey } from '@/hooks/price/useAddPrice'

interface AddPriceModal {
    product: ProductType
    setDateToday: (newVal: Date) => void
    quickAdd?: boolean
}

export const AddPriceModal = ({ product, setDateToday, quickAdd = false }: AddPriceModal) => {
    // Track state of modal open/close
    const [opened, { open, close }] = useDisclosure(false)
    // The save runs in the form, so check for it by its key
    const saving = useIsMutating({ mutationKey: getAddPriceMutationKey(product.productId) }) > 0

    return (
        <>
            <SaveModal pending={saving} opened={opened} onClose={close} title="Add Price">
                <AddPriceForm product={product} setDateToday={setDateToday} close={close} quickAdd={quickAdd} />
            </SaveModal>
            <Button className="m-2" onClick={open}>
                {quickAdd ? 'Quick Price' : 'Add Price'}
            </Button>
        </>
    )
}
