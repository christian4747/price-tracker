import type { ProductType } from "../../../utils/Types"
import ProductContainer from '../containers/ProductPriceListContainer'

type ProductListProps = {
    products: ProductType[]
}

const ProductList = ({products}: ProductListProps) => {
    return (
        <>
            <div className="flex flex-col gap-2 mb-5">
                {products?.map((product) => {
                    return (
                        <ProductContainer
                            key={product.name + product.store}
                            productDetails={product}
                        />
                    )
                })}
            </div>
        </>
    )
}

export default ProductList