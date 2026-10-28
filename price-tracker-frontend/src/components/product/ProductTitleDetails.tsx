import { DeleteProductContext, EditProductContext } from './ProductContext'
import type { ProductType } from '@/types/product'
import { CopyButton, Tooltip } from '@mantine/core'
import { useContext } from 'react'
import { FaLink, FaCheck, FaCopy } from 'react-icons/fa6'
import { MdDelete, MdEdit } from 'react-icons/md'
import { RestoreProductButton } from './RestoreProductButton'

export interface ProductTitleDetails {
    product: ProductType
    otherStoresText?: string
}

export const ProductTitleDetails = ({ product, otherStoresText }: ProductTitleDetails) => {
    const openEditProductModal = useContext(EditProductContext)
    const openDeleteProductModal = useContext(DeleteProductContext)
    // Strike through and gray out deleted products so they stand out when deleted products are shown
    const deletedClassName = product.deletedAt !== null ? 'line-through text-raincloud' : ''

    return (
        <div className="flex gap-3 items-baseline-last">
            <div title={product.name} className={`text-lg max-w-100 truncate ${deletedClassName}`}>
                {product.name}
            </div>

            <div className="text-raincloud">
                <span className={deletedClassName}>{product.store}</span>
                {otherStoresText && ` ${otherStoresText}`}
            </div>

            <a className="cursor-pointer" href={product.link} target="_blank">
                <Tooltip withArrow label={product.link}>
                    <FaLink />
                </Tooltip>
            </a>

            <div
                className="cursor-pointer"
                onClick={(e) => {
                    openEditProductModal(product)
                    e.stopPropagation()
                }}
            >
                <Tooltip withArrow label="Edit Product">
                    <MdEdit />
                </Tooltip>
            </div>

            {product.deletedAt === null && (
                <div
                    className="cursor-pointer"
                    role="img"
                    aria-label="Delete product"
                    onClick={(e) => {
                        openDeleteProductModal(product)
                        e.stopPropagation()
                    }}
                >
                    <Tooltip withArrow label="Delete Product">
                        <MdDelete />
                    </Tooltip>
                </div>
            )}

            {product.deletedAt !== null && <RestoreProductButton product={product} />}

            <CopyButton value={product.name} timeout={1000}>
                {({ copied, copy }) => (
                    <div
                        className="hidden group-hover:block cursor-pointer"
                        onClick={(e) => {
                            copy()
                            e.stopPropagation()
                        }}
                    >
                        <Tooltip label={copied ? 'Copied!' : 'Copy Product Name'} withArrow>
                            {copied ? <FaCheck /> : <FaCopy />}
                        </Tooltip>
                    </div>
                )}
            </CopyButton>
        </div>
    )
}
