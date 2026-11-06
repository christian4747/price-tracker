import type { ProductType } from '@/types/product'
import { TitleSeparator } from '@/components/common/TitleSeparator'

export interface ProductTitleDetails {
    product: ProductType
    otherStoresText?: string
}

export const ProductTitleDetails = ({ product, otherStoresText }: ProductTitleDetails) => {
    // Strike through and gray out the name of deleted products so they stand out when deleted products are shown.
    // The store and brand are already gray, and striking them too would only make them harder to read
    const deletedClassName = product.deletedAt !== null ? 'line-through text-raincloud' : ''

    return (
        // Close together, so the dots between them read like the added and updated dates
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
    )
}
