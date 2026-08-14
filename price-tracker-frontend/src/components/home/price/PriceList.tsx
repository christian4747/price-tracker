import { sortPricesByDateAscending } from "@/utils/PriceUtilities"
import type { ProductType } from "../../../utils/Types"
import AddPriceModal from "../modals/AddPriceModal"
import Price from "./Price"

type Props = {
    product: ProductType
    setDateToday: (newVal: Date) => void
}

const PriceList = ({product, setDateToday}: Props) => {

    const sortedPrices = sortPricesByDateAscending(product.prices)

    return (
        <>
            <div className='flex flex-col max-h-full w-3/10 border border-smoke rounded-sm overflow-hidden justify-between'>
                <div className='flex flex-col bg-smoke font-bold max-h-45 overflow-auto'>
                    {sortedPrices?.map((price) => {
                        price.productId = product.productId
                        return (
                            <Price
                                key={price.priceId}
                                price={price}
                            />
                        )
                    })}
                </div>
                <AddPriceModal
                    product={product}
                    setDateToday={setDateToday}
                />
            </div>
        </>
    )
}

export default PriceList