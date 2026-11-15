import { Accordion } from '@mantine/core'
import type { ProductType } from '@/types/product'
import { rowActionsButtonClassName } from '@/components/common/rowActionsButtonClassName'
import { ProductActionsMenu } from './ProductActionsMenu'

interface ProductRowControl {
    product: ProductType
    children: React.ReactNode
}

// The top of a product row: the accordion's toggle, with the product's actions menu beside it rather than inside.
// The toggle is a button, and a button or link inside another button is invalid HTML that the keyboard can't reach
export const ProductRowControl = ({ product, children }: ProductRowControl) => (
    <div className="group/row flex items-center pr-1">
        {/* A small right padding, so the arrow sits as close to the menu (with the space inside its button) as the
            price does to the arrow */}
        <Accordion.Control className="flex-1 min-w-0 pr-1">{children}</Accordion.Control>
        <ProductActionsMenu product={product} className={rowActionsButtonClassName} />
    </div>
)
