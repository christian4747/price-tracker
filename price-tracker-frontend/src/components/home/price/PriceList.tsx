import { sortPricesByDateAscending } from "@/utils/PriceUtilities"
import type { PriceType, ProductType } from "../../../utils/Types"
import { AddPriceModal } from "../modals/AddPriceModal"
import { Price } from "./Price"
import { EditPriceModal } from "../modals/EditPriceModal"
import { DeletePriceModal } from "../modals/DeletePriceModal"
import { useDisclosure } from "@mantine/hooks"
import { useState } from "react"

interface PriceList {
    product: ProductType
    setDateToday: (newVal: Date) => void
}

export const PriceList = ({product, setDateToday}: PriceList) => {

    if (!product.prices || product.prices.length < 1) return <></>

    const sortedPrices = sortPricesByDateAscending(product.prices)

    // Track state for currently selected price
    const [currentPrice, setCurrentPrice] = useState(sortedPrices[0])
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
                    {sortedPrices?.map((price) => {
                        price.productId = product.productId
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

                {/* Modal Zone */}
                <AddPriceModal
                    product={product}
                    setDateToday={setDateToday}
                />
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