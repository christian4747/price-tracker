import type { ProductType } from '@/types/product'
import { TitleSeparator } from '@/components/common/TitleSeparator'

export interface ProductTitleDetails {
    product: ProductType
    otherStoresText?: string
    // Show the whole title, wrapping over as many lines as it needs, as in the details' header, which has room for
    // more than one line where a row doesn't
    wrap?: boolean
}

export const ProductTitleDetails = ({ product, otherStoresText, wrap = false }: ProductTitleDetails) => {
    // Strike through and gray out the name of deleted products so they stand out when deleted products are shown.
    // The store and brand are already gray, and striking them too would only make them harder to read
    const deletedClassName = product.deletedAt !== null ? 'line-through text-raincloud' : ''

    if (wrap) {
        return (
            // Flowing text rather than a flex row, so the name, store, and brand wrap like a sentence, all in full,
            // with nothing cut off. The 20rem basis keeps the banner and price beside it while there's room for a
            // readable title, and sends them to a line of their own once there isn't, as on a phone. Every character is
            // a possible break, so even a single very long word can't overflow, and the title can shrink to any width.
            <div className="flex-[1_1_20rem] [overflow-wrap:anywhere]">
                <span className={`text-lg ${deletedClassName}`}>{product.name}</span>{' '}
                {/* The store and the brand each move to the next line whole, rather than breaking in the middle, unless
                    one is longer than a whole line. The non-breaking space keeps each dot with the word after it even
                    then */}
                <span className="inline-block max-w-full text-raincloud">
                    <TitleSeparator />
                    &nbsp;
                    {product.store}
                    {otherStoresText && ` ${otherStoresText}`}
                </span>
                {product.brand && (
                    <>
                        {' '}
                        <span className="inline-block max-w-full text-raincloud">
                            <TitleSeparator />
                            &nbsp;
                            {product.brand}
                        </span>
                    </>
                )}
            </div>
        )
    }

    return (
        // Close together, so the dots between them read like the added and updated dates. min-w-0 lets it shrink below
        // its parts' maximum widths added up, which a flex item otherwise won't, so a long title gives up room to the
        // icons and price beside it instead of pushing them out of the row.
        <div className="flex min-w-0 gap-1.5 items-baseline-last">
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
