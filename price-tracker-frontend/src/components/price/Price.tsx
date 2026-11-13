import type { PriceType } from '@/types/price'
import { getPriceDetailsString, getPriceRowDateString, type PriceChange } from '@/utils/priceListUtils'
import { getPriceString } from '@/utils/priceUtils'
import { rowActionsButtonClassName } from '@/components/common/rowActionsButtonClassName'
import { PriceActionsMenu } from './PriceActionsMenu'
import { PriceChangeArrow } from './PriceChangeArrow'

interface Price {
    price: PriceType
    openEditPriceModal: (price: PriceType) => void
    openDeletePriceModal: (price: PriceType) => void
    openPermanentlyDeletePriceModal: (price: PriceType) => void
    // A deleted product's prices can't be edited or restored until the product is restored, which restores them too
    productDeleted: boolean
    // Whether another price in the list starts on the same day, so the date alone wouldn't tell them apart
    showTime?: boolean
    // How the price changed from the one before it in the list, if it can be compared
    change?: PriceChange
    // Whether this is the price in effect now, which is tinted so it stands out from past and upcoming ones
    current?: boolean
    // The moment that counts as now, in milliseconds, so the details line can say whether the price has ended. The
    // list passes the same one it uses for what's upcoming.
    now: number
}

/**
 * One row of a product's price list: the start date, the change arrow, the amount, and the actions menu, with a
 * details line underneath when there's more to say about the price, such as a discount or an end date.
 */
export const Price = ({
    price,
    openEditPriceModal,
    openDeletePriceModal,
    openPermanentlyDeletePriceModal,
    productDeleted,
    showTime = false,
    change,
    current = false,
    now
}: Price) => {
    const priceStartedDateString = getPriceRowDateString(price, showTime)
    const detailsString = getPriceDetailsString(price, now)
    // Strike through and gray out deleted prices so they stand out when deleted prices are shown
    const deletedClassName = price.deletedAt !== null ? 'line-through text-raincloud' : ''
    // The current price gets a pale tint with a bar down its left edge, in the chart line's blue. Green and red already
    // mean a drop and a low, so blue doesn't read as either. The bar is an inset shadow, so it takes no space.
    const currentClassName = current
        ? 'bg-(--mantine-color-blue-0) shadow-[inset_3px_0_0_var(--mantine-color-blue-6)]'
        : ''
    return (
        // Takes its columns from the list (a subgrid), so the date, arrow, amount, and actions button line up with every
        // other row. The current price's tint says which row is current; aria-current says it to screen readers too.
        <li
            className={`group/row col-span-full grid grid-cols-subgrid items-center px-2 py-1 ${currentClassName}`}
            aria-current={current ? 'true' : undefined}
        >
            {/* A size down from the amount, which is what the list is scanned for, so the date fits the narrow column */}
            <div className={`min-w-0 pr-1 text-sm ${deletedClassName}`}>{priceStartedDateString}</div>
            <PriceChangeArrow change={change} />
            {/* Bold, since it's the number the list is scanned for, right-aligned so amounts of any width line up */}
            <div className={`text-right font-bold tabular-nums ${deletedClassName}`}>{getPriceString(price)}</div>
            <PriceActionsMenu
                price={price}
                openEditPriceModal={openEditPriceModal}
                openDeletePriceModal={openDeletePriceModal}
                openPermanentlyDeletePriceModal={openPermanentlyDeletePriceModal}
                productDeleted={productDeleted}
                className={rowActionsButtonClassName}
            />
            {/* Under the whole row, amount and actions button included, so it has room to wrap. Two lines fit the end
                date of a sale with a description, and anything longer is cut off, with all of it on hover */}
            {detailsString && (
                <div className="col-span-full line-clamp-2 text-xs text-raincloud" title={detailsString}>
                    {detailsString}
                </div>
            )}
        </li>
    )
}
