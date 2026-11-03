import { DeleteProductContext, EditProductContext } from './ProductContext'
import type { ProductType } from '@/types/product'
import { CopyButton, Tooltip } from '@mantine/core'
import { useContext } from 'react'
import { FaLink, FaCheck, FaCopy } from 'react-icons/fa6'
import { MdDelete, MdEdit } from 'react-icons/md'
import { PermanentlyDeleteProductButton } from './PermanentlyDeleteProductButton'
import { RestoreProductButton } from './RestoreProductButton'
import { TitleSeparator } from '@/components/common/TitleSeparator'

export interface ProductTitleDetails {
    product: ProductType
    otherStoresText?: string
}

export const ProductTitleDetails = ({ product, otherStoresText }: ProductTitleDetails) => {
    const openEditProductModal = useContext(EditProductContext)
    const openDeleteProductModal = useContext(DeleteProductContext)
    // Strike through and gray out the name of deleted products so they stand out when deleted products are shown.
    // The store and brand are already gray, and striking them too would only make them harder to read
    const deletedClassName = product.deletedAt !== null ? 'line-through text-raincloud' : ''

    return (
        <div className="flex gap-3 items-baseline-last">
            {/* Closer together than the icons, so the dots between them read like the added and updated dates */}
            <div className="flex gap-1.5 items-baseline-last">
                <div title={product.name} className={`text-lg max-w-100 truncate ${deletedClassName}`}>
                    {product.name}
                </div>

                <TitleSeparator />

                <div className="text-raincloud">
                    {/* Only the store is truncated, so the count of other stores stays visible */}
                    <span title={product.store} className="inline-block max-w-40 truncate align-bottom">
                        {product.store}
                    </span>
                    {otherStoresText && ` ${otherStoresText}`}
                </div>

                {product.brand && (
                    <>
                        <TitleSeparator />

                        <div title={product.brand} className="text-raincloud max-w-40 truncate">
                            {product.brand}
                        </div>
                    </>
                )}
            </div>

            <a className="cursor-pointer" href={product.link} target="_blank">
                <Tooltip withArrow label={product.link}>
                    <FaLink />
                </Tooltip>
            </a>

            <div
                className="cursor-pointer"
                role="img"
                aria-label="Edit product"
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

            {product.deletedAt !== null && <PermanentlyDeleteProductButton product={product} />}

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
