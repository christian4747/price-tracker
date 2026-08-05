import type { ProductType } from "../../../utils/Types"
import ProductContainer from '../containers/ProductPriceListContainer'

type ProductListProps = {
    products: ProductType[]
}

const ProductList = ({products}: ProductListProps) => {
    return (
        <>
            <div className="flex pb-5 flex-col border-smoke">
                {products?.map((product) => {
                    return (
                        <ProductContainer
                            key={product.name + product.store}
                            product={product}
                        />
                    )
                })}
            </div>
        </>
    )
}

export default ProductList