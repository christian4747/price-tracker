import type { ProductType } from '@/utils/Types'
import { CopyButton, Tooltip } from '@mantine/core'
import { FaLink, FaCheck, FaCopy } from 'react-icons/fa6'
import DeleteProductModal from '../modals/DeleteProductModal'
import EditProductModal from '../modals/EditProductModal'

export interface ProductTitleDetails {
    product: ProductType
    storeString?: string
}

export const ProductTitleDetails = ({ product, storeString }: ProductTitleDetails) => {
    return (
        <div className='flex gap-3 items-baseline-last'>
            <div title={product.name} className="text-lg max-w-100 truncate">
                {product.name}
            </div>

            <div className="text-raincloud">
                {storeString ? storeString : product.store}
            </div>

            <a className="cursor-pointer" href={product.link} target="_blank">
                <Tooltip withArrow label={product.link}><FaLink /></Tooltip>
            </a>

            <EditProductModal product={product} />

            <DeleteProductModal product={product} />

            <CopyButton value={product.name} timeout={1000}>
                {({ copied, copy }) => (
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
                            {copied ? <FaCheck /> : <FaCopy />}
                        </Tooltip>
                    </div>
                )}
            </CopyButton>
        </div>
    )
}