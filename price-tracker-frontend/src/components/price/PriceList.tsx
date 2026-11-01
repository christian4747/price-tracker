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
import { Checkbox } from '@mantine/core'

interface PriceList {
    productBody: ProductBody
    prices: PriceType[]
    setDateToday: (newVal: Date) => void
    showDeleted: boolean
    setShowDeleted: React.Dispatch<React.SetStateAction<boolean>>
}

export const PriceList = ({ productBody, setDateToday, prices, showDeleted, setShowDeleted }: PriceList) => {
    const { product } = productBody
    // Track state for currently selected price
    const [currentPrice, setCurrentPrice] = useState(prices[0])
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
                <div className="flex flex-col bg-smoke font-bold max-h-45 overflow-auto">
                    {prices.map((price) => {
                        price.productId = product.productId
                        if (price.today === true) return
                        return (
                            <Price
                                key={price.priceId}
                                price={price}
                                openDeletePriceModal={openDeletePriceModal}
                                openPermanentlyDeletePriceModal={openPermanentlyDeletePriceModal}
                                openEditPriceModal={openEditPriceModal}
                            />
                        )
                    })}
                </div>

                <div className="flex flex-col">
                    <PriceAverage productBody={productBody} />
                    <Checkbox
                        className="px-2 pt-2"
                        label="Show deleted prices"
                        checked={showDeleted}
                        onChange={(e) => setShowDeleted(e.currentTarget.checked)}
                    />
                    <div className="flex gap-1 justify-center">
                        <AddPriceModal product={product} setDateToday={setDateToday} />
                        {prices && prices.length > 0 && (
                            <AddPriceModal product={product} setDateToday={setDateToday} quickAdd={true} />
                        )}
                    </div>
                </div>

                {/* Modal Zone */}
                <EditPriceModal price={currentPrice} closeEditPrice={closeEditPrice} opened={editPriceOpened} />
                <DeletePriceModal price={currentPrice} closeDeletePrice={closeDeletePrice} opened={deletePriceOpened} />
                <PermanentlyDeletePriceModal
                    price={currentPrice}
                    closeModal={closePermanentlyDeletePrice}
                    opened={permanentlyDeletePriceOpened}
                />
            </div>
        </>
    )
}
