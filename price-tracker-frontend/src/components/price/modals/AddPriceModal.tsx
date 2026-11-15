import { Button } from '@mantine/core'
import type { ProductType } from '@/types/product'
import type { PriceType } from '@/types/price'
import { useDisclosure } from '@mantine/hooks'
import { useIsMutating } from '@tanstack/react-query'
import { AddPriceForm } from '@/components/price/forms/AddPriceForm'
import { SaveModal } from '@/components/common/SaveModal'
import { getAddPriceMutationKey } from '@/hooks/price/useAddPrice'

interface AddPriceModal {
    product: ProductType
    setDateToday: (newVal: Date) => void
    // Makes this the Quick Price button, which fills the form from this price
    quickAddPrice?: PriceType
}

/**
 * The Add Price or Quick Price button under a product's price list, with the add price modal it opens. Quick Price
 * fills the modal from the price it's given, the product's newest price.
 */
export const AddPriceModal = ({ product, setDateToday, quickAddPrice }: AddPriceModal) => {
    // Track state of modal open/close
    const [opened, { open, close }] = useDisclosure(false)
    // The save runs in the form, so check for it by its key
    const saving = useIsMutating({ mutationKey: getAddPriceMutationKey(product.productId) }) > 0

    return (
        <>
            <SaveModal pending={saving} opened={opened} onClose={close} title="Add Price" size="lg">
                <AddPriceForm
                    product={product}
                    setDateToday={setDateToday}
                    close={close}
                    quickAddPrice={quickAddPrice}
                />
            </SaveModal>
            <Button className="m-2" onClick={open}>
                {quickAddPrice ? 'Quick Price' : 'Add Price'}
            </Button>
        </>
    )
}
