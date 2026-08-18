import { FaCheck, FaCopy, FaLink } from "react-icons/fa6"
import type { ProductType } from "../../../utils/Types"
import DeleteProductModal from "../modals/DeleteProductModal"
import EditProductModal from "../modals/EditProductModal"
import { CopyButton, Tooltip } from "@mantine/core"

type ProductProps = {
    product: ProductType
}

const Product = ({product}: ProductProps) => {
    return (
        <>
            <div className='flex gap-3 items-baseline-last'>
                <div title={product.name} className="text-lg max-w-100 truncate">
                    {product.name}
                </div>
                <div className="text-raincloud">
                    {product.store}
                </div>
                <a className="cursor-pointer" href={product.link} target="_blank">
                    <Tooltip withArrow label={product.link}><FaLink /></Tooltip>
                </a>
                <EditProductModal product={product}/>
                <DeleteProductModal product={product}/>
                <CopyButton value={product.name} timeout={1000}>
                    {({copied, copy}) => (
                        <div
                            className="hidden group-hover:block cursor-pointer"
                            onClick={(e) => {
                                copy()
                                e.stopPropagation()
                            }}
                        >
                            <Tooltip
                                label={copied ? 'Copied!' : 'Copy Product Name'}
                                withArrow
                            >
                                {copied ? <FaCheck /> :<FaCopy />}
                            </Tooltip>
                        </div>
                    )}
                </CopyButton>
            </div>
        </>
    )
}

export default Product