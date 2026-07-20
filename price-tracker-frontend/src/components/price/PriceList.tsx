import type { PriceType, ProductType } from "../../utils/Types"
import Price from './PriceContainer'
import Button from '../common/Button'
import { FiPlus } from 'react-icons/fi'

type Props = {
    product: ProductType,
    sortedPrices: PriceType[],
    toggleShowAddPrice: any,
    setProduct: any
}

const PriceList = ({product, sortedPrices, setProduct, toggleShowAddPrice}: Props) => {
    return (
        <>
            <div className='flex flex-col w-3/10 border-1 border-[#BCBBBD] rounded-sm overflow-hidden justify-between'>
                <div className='flex flex-col overflow-hidden bg-[#BCBBBD] font-bold font-mono'>
                    {sortedPrices?.map((price) => {
                        price.productId = product.productId
                        return (
                            <Price
                                key={price.priceId}
                                price={price}
                                product={product}
                                setProduct={setProduct}
                            />
                        )
                    })}
                </div>
                <Button
                    onClick={toggleShowAddPrice}
                    className="mb-2 ml-2 mr-2"
                >
                    <FiPlus size={24} />
                </Button>
            </div>
        </>
    )
}

export default PriceList