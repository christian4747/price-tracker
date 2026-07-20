import { FiPlus } from 'react-icons/fi'
import type { ProductType } from "../../utils/Types"
import Button from '../common/Button'
import ProductContainer from './ProductContainer'

type ProductListProps = {
    products: ProductType[],
    toggleAddProduct: React.Dispatch<React.SetStateAction<boolean>>
}

const ProductList = ({products, toggleAddProduct}: ProductListProps) => {
    return (
        <>
            <div className="flex items-baseline gap-2 justify-between">
                <div className="flex items-center gap-2">
                    <div className="text-5xl font-bold mb-3 font-mono">
                        Products
                    </div>
                    <Button
                        onClick={toggleAddProduct}
                    >
                        <FiPlus size={24} />
                    </Button>
                </div>
                {/* <div className="pr-2">
                    <FaFilter size={24} />
                </div> */}
            </div>

            <div className="flex flex-col gap-2 mb-5">
                {products?.map((product) => {
                    return (
                        <ProductContainer
                            key={product.productId}
                            productDetails={product}
                        />
                    )
                })}
            </div>
        </>
    )
}

export default ProductList