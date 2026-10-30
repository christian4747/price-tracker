import type { PriceType } from '@/types/price'
import { getUSDateStringFromTimestamp } from '@/utils/dateUtils'
import { getPriceString } from '@/utils/priceUtils'
import { Loader, Tooltip } from '@mantine/core'
import { MdDelete, MdEdit, MdUndo } from 'react-icons/md'
import { useRestorePrice } from '@/hooks/price/useRestorePrice'

interface Price {
    price: PriceType
    openEditPriceModal: (price: PriceType) => void
    openDeletePriceModal: (price: PriceType) => void
}

export const Price = ({ price, openEditPriceModal, openDeletePriceModal }: Price) => {
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
                <div
                    className="cursor-pointer"
                    onClick={(e) => {
                        openEditPriceModal(price)
                        e.stopPropagation()
                    }}
                >
                    <Tooltip withArrow label="Edit Price">
                        <MdEdit />
                    </Tooltip>
                </div>

                {price.deletedAt === null && (
                    <div
                        className="cursor-pointer"
                        role="img"
                        aria-label="Delete price"
                        onClick={(e) => {
                            openDeletePriceModal(price)
                            e.stopPropagation()
                        }}
                    >
                        <Tooltip withArrow label="Delete Price">
                            <MdDelete />
                        </Tooltip>
                    </div>
                )}

                {price.deletedAt !== null && (
                    <div
                        className="cursor-pointer"
                        role="img"
                        aria-label="Restore price"
                        onClick={(e) => {
                            if (!restoreMutation.isPending) restoreMutation.mutate()
                            e.stopPropagation()
                        }}
                    >
                        {restoreMutation.isPending ? (
                            <Loader size={16} />
                        ) : (
                            <Tooltip withArrow label="Restore Price">
                                <MdUndo />
                            </Tooltip>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
