import { FaLink } from "react-icons/fa6"
import { MdEdit } from "react-icons/md"
import type { ProductType } from "../../../utils/Types"
import DeleteProductModal from "../modals/DeleteProductModal"

type ProductProps = {
    product: ProductType
    toggleShowEdit: () => void
}

const Product = ({product, toggleShowEdit}: ProductProps) => {
    return (
        <>
            <div className='flex gap-3 items-baseline-last'>
                <div className="text-lg max-w-125 truncate untruncate">
                    {product.name}
                </div>
                <div className="text-raincloud">
                    {product.store}
                </div>
                <a className="cursor-pointer" href={product.link} target="_blank">
                    <FaLink />
                </a>
                <div
                    className="hidden group-hover:block cursor-pointer"
                    onClick={(e) => {
                        toggleShowEdit()
                        e.stopPropagation()
                    }}
                >
                    <MdEdit />
                </div>
                <DeleteProductModal product={product}/>
            </div>
        </>
    )
}

export default Product