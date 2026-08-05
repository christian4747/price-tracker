import type { PriceType } from "../../../utils/Types"
import PriceContainer from '../containers/PriceContainer'
import Button from '../../common/Button'
import { FiPlus } from 'react-icons/fi'

type Props = {
    sortedPrices: PriceType[],
    toggleShowAddPrice: () => void,
    productId: number
}

const PriceList = ({sortedPrices, toggleShowAddPrice, productId}: Props) => {
    return (
        <>
            <div className='flex flex-col max-h-full w-3/10 border border-smoke rounded-sm overflow-hidden justify-between'>
                <div className='flex flex-col bg-smoke font-bold max-h-45 overflow-auto'>
                    {sortedPrices?.map((price) => {
                        price.productId = productId
                        return (
                            <PriceContainer
                                key={price.priceId}
                                price={price}
                            />
                        )
                    })}
                </div>
                <Button
                    onClick={toggleShowAddPrice}
                    className="m-2"
                >
                    <FiPlus size={24} />
                </Button>
            </div>
        </>
    )
}

export default PriceList