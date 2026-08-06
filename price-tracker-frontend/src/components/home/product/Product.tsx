import { FaLink } from "react-icons/fa6"
import { MdDelete, MdEdit } from "react-icons/md"
import type { ProductType } from "../../../utils/Types"

type ProductProps = {
    product: ProductType,
    toggleShowEdit: () => void,
    toggleShowDelete: () => void
}

const Product = ({product, toggleShowEdit, toggleShowDelete}: ProductProps) => {
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
                <div
                    className="hidden group-hover:block cursor-pointer"
                    onClick={(e) => {
                        toggleShowDelete()
                        e.stopPropagation()
                    }}
                >
                    <MdDelete />
                </div>
            </div>
        </>
    )
}

export default Product