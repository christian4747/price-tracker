import { FaLink } from "react-icons/fa6"
import { MdDelete, MdEdit } from "react-icons/md"
import type { ProductType } from "../../utils/Types"

type ProductProps = {
    product: ProductType,
    toggleShowEdit: () => void,
    toggleShowDelete: () => void
}

const Product = ({product, toggleShowEdit, toggleShowDelete}: ProductProps) => {
    return (
        <>
            <div className='flex gap-3 items-baseline-last'>
                <div className="font-bold text-3xl font-mono">
                    {product.name}
                </div>
                <div className="font-mono">
                    {product.store}
                </div>
                <a className="cursor-pointer" href={product.link} target="_blank">
                    <FaLink />
                </a>
                <div className="hidden group-hover:block cursor-pointer" onClick={toggleShowEdit}>
                    <MdEdit />
                </div>
                <div className="hidden group-hover:block cursor-pointer" onClick={toggleShowDelete}>
                    <MdDelete />
                </div>
            </div>
        </>
    )
}

export default Product