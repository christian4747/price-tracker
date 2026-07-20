import type { ProductType } from '../../App'
import Product from './Product'

type ProductListProps = {
    products: ProductType[]
}

const ProductList = ({products}: ProductListProps) => {
    return (
        <div className="flex flex-col gap-2 mb-5">
            {products?.map((product) => {
                return (
                    <Product
                        key={product.productId}
                        productDetails={product}
                    />
                )
            })}
        </div>
    )
}

export default ProductList