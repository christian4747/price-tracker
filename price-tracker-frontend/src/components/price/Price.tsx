import type { PriceType } from '@/types/price'
import { getUSDateStringFromTimestamp } from '@/utils/dateUtils'
import { getPriceString } from '@/utils/priceUtils'
import { MdDelete, MdDeleteForever, MdEdit, MdUndo } from 'react-icons/md'
import { IconAction } from '@/components/common/IconAction'
import { useRestorePrice } from '@/hooks/price/useRestorePrice'

interface Price {
    price: PriceType
    openEditPriceModal: (price: PriceType) => void
    openDeletePriceModal: (price: PriceType) => void
    openPermanentlyDeletePriceModal: (price: PriceType) => void
}

export const Price = ({ price, openEditPriceModal, openDeletePriceModal, openPermanentlyDeletePriceModal }: Price) => {
    // Constructing the string to show the date on the PriceList
    const priceStartedDateString = getUSDateStringFromTimestamp(price.priceStarted)
    // Hook for restoring deleted prices
    const { mutation: restoreMutation } = useRestorePrice(price)
    // Strike through and gray out deleted prices so they stand out when deleted prices are shown
    const deletedClassName = price.deletedAt !== null ? 'line-through text-raincloud' : ''

    return (
        <div className="flex justify-between even:bg-cloud group/product">
            <div className={`pl-2 ${deletedClassName}`}>{priceStartedDateString}</div>
            <div className="pr-2 flex items-center gap-1">
                <div className={deletedClassName}>{getPriceString(price)}</div>
                <IconAction label="Edit price" icon={<MdEdit />} size="sm" onClick={() => openEditPriceModal(price)} />

                {price.deletedAt === null && (
                    <IconAction
                        label="Delete price"
                        icon={<MdDelete />}
                        size="sm"
                        onClick={() => openDeletePriceModal(price)}
                    />
                )}

                {/* While restoring, the button shows a loader and is disabled, so a second click can't restore twice */}
                {price.deletedAt !== null && (
                    <IconAction
                        label="Restore price"
                        icon={<MdUndo />}
                        size="sm"
                        loading={restoreMutation.isPending}
                        onClick={() => restoreMutation.mutate()}
                    />
                )}

                {price.deletedAt !== null && (
                    <IconAction
                        label="Permanently delete price"
                        icon={<MdDeleteForever />}
                        size="sm"
                        onClick={() => openPermanentlyDeletePriceModal(price)}
                    />
                )}
            </div>
        </div>
    )
}
