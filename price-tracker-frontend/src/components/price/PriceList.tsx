import type { PriceType } from '@/types/price'
import type { ProductBody } from '@/types/product'
import { AddPriceModal } from './modals/AddPriceModal'
import { Price } from './Price'
import { PriceAverage } from './PriceAverage'
import { EditPriceModal } from './modals/EditPriceModal'
import { DeletePriceModal } from './modals/DeletePriceModal'
import { PermanentlyDeletePriceModal } from './modals/PermanentlyDeletePriceModal'
import { useDisclosure } from '@mantine/hooks'
import { Fragment, useState } from 'react'
import { Checkbox } from '@mantine/core'
import { getPriceChanges, getPriceTimeline, getSameDayPriceIds } from '@/utils/priceListUtils'
import { MdSchedule } from 'react-icons/md'

interface PriceList {
    productBody: ProductBody
    prices: PriceType[]
    setDateToday: (newVal: Date) => void
    showDeleted: boolean
    setShowDeleted: React.Dispatch<React.SetStateAction<boolean>>
}

/**
 * A product's prices beside its chart, newest first, with the average price, the Show deleted prices checkbox, and the
 * Add Price and Quick Price buttons underneath. It also holds the modals for adding, editing, and deleting a price.
 */
export const PriceList = ({ productBody, setDateToday, prices, showDeleted, setShowDeleted }: PriceList) => {
    const { product } = productBody
    // The backend rejects adding, editing, and restoring prices until the product is restored
    const productDeleted = product.deletedAt !== null
    // Track state for currently selected price
    const [currentPrice, setCurrentPrice] = useState(prices[0])
    // Prices that start on the same day as another show their time, so the dates alone don't look like duplicates
    const sameDayPriceIds = getSameDayPriceIds(prices)
    // Each price's arrow compares it with the price before it
    const priceChanges = getPriceChanges(prices)
    // The prices that haven't started yet sit under an "Upcoming" label, and the price in effect now is tinted, so the
    // past prices are the plain rows below it
    const { currentPriceId, upcomingPriceIds } = getPriceTimeline(prices)
    // The list is newest first, so the upcoming prices are all at the top and their label goes above the first one
    // Today's entry is skipped, since it shares the current price's ID and the list doesn't draw it
    const firstUpcomingPrice = prices.find((price) => !price.today && upcomingPriceIds.has(price.priceId))
    // The delete confirmations name the price the same way as its row
    const currentPriceShowsTime = currentPrice !== undefined && sameDayPriceIds.has(currentPrice.priceId)
    // Track state of modal open/close
    const [editPriceOpened, { open: openEditPrice, close: closeEditPrice }] = useDisclosure(false)
    const [deletePriceOpened, { open: openDeletePrice, close: closeDeletePrice }] = useDisclosure(false)
    const [permanentlyDeletePriceOpened, { open: openPermanentlyDeletePrice, close: closePermanentlyDeletePrice }] =
        useDisclosure(false)

    const openEditPriceModal = (price: PriceType) => {
        setCurrentPrice(price)
        openEditPrice()
    }

    const openDeletePriceModal = (price: PriceType) => {
        setCurrentPrice(price)
        openDeletePrice()
    }

    const openPermanentlyDeletePriceModal = (price: PriceType) => {
        setCurrentPrice(price)
        openPermanentlyDeletePrice()
    }

    return (
        <>
            <div className="flex flex-col h-full border border-smoke rounded-sm overflow-hidden justify-between">
                {/* White rows with thin dividers, like the product rows. The columns, which every row shares, are the
                    date, the change arrow, the amount, and the actions button, each as wide as its widest row. */}
                <ul
                    aria-label="Prices"
                    className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-x-1 content-start min-h-0 overflow-auto divide-y divide-smoke"
                >
                    {prices.map((price) => {
                        if (price.today === true) return
                        return (
                            <Fragment key={price.priceId}>
                                {/* A small gray label rather than graying the rows out, since gray rows already mean
                                    deleted prices. No divider under it, so it reads as part of the rows it labels.
                                    It's a presentation item, not a list item, so screen readers count only the prices,
                                    but they still read its text before the upcoming ones. */}
                                {price === firstUpcomingPrice && (
                                    <li
                                        role="presentation"
                                        className="col-span-full flex items-center gap-1 border-b-0 px-2 pt-1.5 text-xs text-raincloud"
                                    >
                                        <MdSchedule aria-hidden="true" />
                                        Upcoming
                                    </li>
                                )}
                                <Price
                                    price={price}
                                    openDeletePriceModal={openDeletePriceModal}
                                    openPermanentlyDeletePriceModal={openPermanentlyDeletePriceModal}
                                    openEditPriceModal={openEditPriceModal}
                                    productDeleted={productDeleted}
                                    showTime={sameDayPriceIds.has(price.priceId)}
                                    change={priceChanges.get(price.priceId)}
                                    current={price.priceId === currentPriceId}
                                />
                            </Fragment>
                        )
                    })}
                </ul>

                <div className="flex flex-col">
                    <PriceAverage productBody={productBody} />
                    <Checkbox
                        className="px-2 pt-2"
                        label="Show deleted prices"
                        checked={showDeleted}
                        onChange={(e) => setShowDeleted(e.currentTarget.checked)}
                    />
                    {!productDeleted && (
                        <div className="flex gap-1 justify-center">
                            <AddPriceModal product={product} setDateToday={setDateToday} />
                            {prices && prices.length > 0 && (
                                <AddPriceModal product={product} setDateToday={setDateToday} quickAdd={true} />
                            )}
                        </div>
                    )}
                </div>

                {/* Modal Zone */}
                <EditPriceModal
                    price={currentPrice}
                    productId={product.productId}
                    closeEditPrice={closeEditPrice}
                    opened={editPriceOpened}
                />
                <DeletePriceModal
                    price={currentPrice}
                    closeDeletePrice={closeDeletePrice}
                    opened={deletePriceOpened}
                    showTime={currentPriceShowsTime}
                />
                <PermanentlyDeletePriceModal
                    price={currentPrice}
                    closeModal={closePermanentlyDeletePrice}
                    opened={permanentlyDeletePriceOpened}
                    showTime={currentPriceShowsTime}
                />
            </div>
        </>
    )
}
