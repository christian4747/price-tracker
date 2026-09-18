import type { PriceType, ProductType } from "../../../utils/Types"
import { AddPriceModal } from "../modals/AddPriceModal"
import { Price } from "./Price"
import { EditPriceModal } from "../modals/EditPriceModal"
import { DeletePriceModal } from "../modals/DeletePriceModal"
import { useDisclosure } from "@mantine/hooks"
import { useState } from "react"
import { Checkbox } from "@mantine/core"

interface PriceList {
    product: ProductType
    prices: PriceType[]
    setDateToday: (newVal: Date) => void
    showDeleted: boolean
    setShowDeleted: React.Dispatch<React.SetStateAction<boolean>>
}

export const PriceList = ({ product, setDateToday, prices, showDeleted, setShowDeleted }: PriceList) => {

    // Track state for currently selected price
    const [currentPrice, setCurrentPrice] = useState(prices[0])
    // Track state of modal open/close
    const [editPriceOpened, { open: openEditPrice, close: closeEditPrice }] = useDisclosure(false)
    const [deletePriceOpened, { open: openDeletePrice, close: closeDeletePrice }] = useDisclosure(false)

    const openEditPriceModal = (price: PriceType) => {
        setCurrentPrice(price)
        openEditPrice()
    }

    const openDeletePriceModal = (price: PriceType) => {
        setCurrentPrice(price)
        openDeletePrice()
    }

    return (
        <>
            <div className='flex flex-col h-full border border-smoke rounded-sm overflow-hidden justify-between'>
                <div className='flex flex-col bg-smoke font-bold max-h-45 overflow-auto'>
                    {prices.map((price) => {
                        price.productId = product.productId
                        if (price.today === true) return
                        return (
                            <Price
                                key={price.priceId}
                                price={price}
                                openDeletePriceModal={openDeletePriceModal}
                                openEditPriceModal={openEditPriceModal}
                            />
                        )
                    })}
                </div>

                <div className='flex flex-col'>
                    <Checkbox
                        className="px-2"
                        label="Show deleted prices"
                        checked={showDeleted}
                        onChange={(e) => setShowDeleted(e.currentTarget.checked)}
                    />
                    <AddPriceModal
                        product={product}
                        setDateToday={setDateToday}
                    />
                </div>
                

                {/* Modal Zone */}
                <EditPriceModal
                    price={currentPrice}
                    closeEditPrice={closeEditPrice}
                    opened={editPriceOpened}
                />
                <DeletePriceModal
                    price={currentPrice}
                    closeDeletePrice={closeDeletePrice}
                    opened={deletePriceOpened}
                />
            </div>
        </>
    )
}