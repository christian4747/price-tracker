import { FaLink } from "react-icons/fa6"
import type { ProductType } from "../../../utils/Types"
import DeleteProductModal from "../modals/DeleteProductModal"
import EditProductModal from "../modals/EditProductModal"

type ProductProps = {
    product: ProductType
}

const Product = ({product}: ProductProps) => {
    return (
        <>
            <div className='flex gap-3 items-baseline-last'>
                <div title={product.name} className="text-lg max-w-110 truncate">
                    {product.name}
                </div>
                <div className="text-raincloud">
                    {product.store}
                </div>
                <a className="cursor-pointer" href={product.link} target="_blank">
                    <FaLink />
                </a>
                <EditProductModal product={product}/>
                <DeleteProductModal product={product}/>
            </div>
        </>
    )
}

export default Product