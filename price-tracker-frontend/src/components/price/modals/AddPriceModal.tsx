import { Button } from '@mantine/core'
import type { ProductType } from '@/types/product'
import { useDisclosure } from '@mantine/hooks'
import { useIsMutating } from '@tanstack/react-query'
import { AddPriceForm } from '@/components/price/forms/AddPriceForm'
import { SaveModal } from '@/components/common/SaveModal'
import { getAddPriceMutationKey } from '@/hooks/price/useAddPrice'
import { MdAdd, MdBolt } from 'react-icons/md'

interface AddPriceModal {
    product: ProductType
    setDateToday: (newVal: Date) => void
    quickAdd?: boolean
}

/**
 * The Add Price or Quick Price button in the footer under a product's price list, with the add price modal it opens.
 * Quick Price fills the modal from the product's latest price.
 */
export const AddPriceModal = ({ product, setDateToday, quickAdd = false }: AddPriceModal) => {
    // Track state of modal open/close
    const [opened, { open, close }] = useDisclosure(false)
    // The save runs in the form, so check for it by its key
    const saving = useIsMutating({ mutationKey: getAddPriceMutationKey(product.productId) }) > 0

    return (
        // One item in the footer's flex line, taking an equal share of it with the other button. The modal goes in a
        // portal at the end of the page, but without portals (as in tests) it leaves a node beside the button, which
        // would otherwise take a share of the line's gaps.
        <div className="flex flex-1">
            <SaveModal pending={saving} opened={opened} onClose={close} title="Add Price" size="lg">
                <AddPriceForm product={product} setDateToday={setDateToday} close={close} quickAdd={quickAdd} />
            </SaveModal>
            {/* Small, so the footer leaves the list more room. Quick Price is outlined so it reads as the second choice
                beside the filled Add Price. The icons go when the footer's button line (a container) is under 16rem,
                where both buttons with icons need more room than it has (about 15.5rem) and would run out of the
                footer. The labels say what the buttons do, so they stay. */}
            <Button
                className="flex-1"
                classNames={{ section: '@max-[16rem]:hidden' }}
                size="xs"
                variant={quickAdd ? 'default' : 'filled'}
                leftSection={quickAdd ? <MdBolt size={16} /> : <MdAdd size={16} />}
                onClick={open}
            >
                {quickAdd ? 'Quick Price' : 'Add Price'}
            </Button>
        </div>
    )
}
