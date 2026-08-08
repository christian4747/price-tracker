import type { PriceType, ProductType } from "../../../utils/Types"
import PriceContainer from '../containers/PriceContainer'
import AddPriceModal from "../modals/AddPriceModal"

type Props = {
    sortedPrices: PriceType[]
    product: ProductType
}

const PriceList = ({sortedPrices, product}: Props) => {
    return (
        <>
            <div className='flex flex-col max-h-full w-3/10 border border-smoke rounded-sm overflow-hidden justify-between'>
                <div className='flex flex-col bg-smoke font-bold max-h-45 overflow-auto'>
                    {sortedPrices?.map((price) => {
                        price.productId = product.productId
                        return (
                            <PriceContainer
                                key={price.priceId}
                                price={price}
                            />
                        )
                    })}
                </div>
                <AddPriceModal
                    product={product}
                />
            </div>
        </>
    )
}

export default PriceList