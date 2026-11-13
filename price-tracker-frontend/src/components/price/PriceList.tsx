import type { PriceType } from '@/types/price'
import type { ProductBody } from '@/types/product'
import { AddPriceModal } from './modals/AddPriceModal'
import { Price } from './Price'
import { PriceAverage } from './PriceAverage'
import { EditPriceModal } from './modals/EditPriceModal'
import { DeletePriceModal } from './modals/DeletePriceModal'
import { PermanentlyDeletePriceModal } from './modals/PermanentlyDeletePriceModal'
import { useDisclosure } from '@mantine/hooks'
import { useState } from 'react'
import { Switch } from '@mantine/core'
import { getPriceChanges, getSameDayPriceIds } from '@/utils/priceListUtils'

interface PriceList {
    productBody: ProductBody
    prices: PriceType[]
    setDateToday: (newVal: Date) => void
    showDeleted: boolean
    setShowDeleted: React.Dispatch<React.SetStateAction<boolean>>
}

/**
 * A product's prices beside its chart, newest first, with a footer underneath holding the average price, the Show
 * deleted switch, and the Add Price and Quick Price buttons. It also holds the modals for adding, editing, and deleting a price.
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
                            <Price
                                key={price.priceId}
                                price={price}
                                openDeletePriceModal={openDeletePriceModal}
                                openPermanentlyDeletePriceModal={openPermanentlyDeletePriceModal}
                                openEditPriceModal={openEditPriceModal}
                                productDeleted={productDeleted}
                                showTime={sameDayPriceIds.has(price.priceId)}
                                change={priceChanges.get(price.priceId)}
                            />
                        )
                    })}
                </ul>

                {/* A compact footer under a thin divider, so the list keeps as much room as it can */}
                <div className="flex flex-col gap-2 p-2 border-t border-smoke">
                    {/* The average on the left and the switch on the right. When both don't fit, flex-wrap moves the
                        switch to a line of its own rather than squeezing them, which would break the average between
                        "Average" and its amount. ml-auto keeps the switch on the right there, and when the average is
                        left out. */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <PriceAverage productBody={productBody} />
                        <Switch
                            className="ml-auto"
                            size="xs"
                            label="Show deleted"
                            checked={showDeleted}
                            onChange={(e) => setShowDeleted(e.currentTarget.checked)}
                        />
                    </div>
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
