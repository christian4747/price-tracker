import { Accordion } from '@mantine/core'
import type { ProductType } from '@/types/product'
import { ProductActionsMenu } from './ProductActionsMenu'

interface ProductRowControl {
    product: ProductType
    children: React.ReactNode
}

// When the actions button shows fully. It's faint the rest of the time, so closed rows look calm but still show they
// have actions. It shows fully while the row is hovered, while the row or its menu is open (both mark themselves
// aria-expanded), when Tab reaches it, and always on touch screens, which can't hover
const actionsButtonClassName =
    'opacity-30 transition-opacity group-hover/row:opacity-100 group-has-[[aria-expanded=true]]/row:opacity-100 ' +
    'focus-visible:opacity-100 [@media(hover:none)]:opacity-100'

// The top of a product row: the accordion's toggle, with the product's actions menu beside it rather than inside.
// The toggle is a button, and a button or link inside another button is invalid HTML that the keyboard can't reach
export const ProductRowControl = ({ product, children }: ProductRowControl) => (
    <div className="group/row flex items-center pr-1">
        {/* A small right padding, so the arrow sits as close to the menu (with the space inside its button) as the
            price does to the arrow */}
        <Accordion.Control className="flex-1 min-w-0 pr-1">{children}</Accordion.Control>
        <ProductActionsMenu product={product} className={actionsButtonClassName} />
    </div>
)
