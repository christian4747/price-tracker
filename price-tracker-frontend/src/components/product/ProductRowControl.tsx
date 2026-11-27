import { AccordionChevron, UnstyledButton } from '@mantine/core'
import type { ProductType } from '@/types/product'
import { rowActionsButtonClassName } from '@/components/common/rowActionsButtonClassName'
import { ProductActionsMenu } from './ProductActionsMenu'

interface ProductRowControl {
    product: ProductType
    // Whether the product's details are open
    opened: boolean
    onOpen: () => void
    children: React.ReactNode
}

// The top of a product row: a button that opens the product's details, with the product's actions menu beside it
// rather than inside. A button or link inside another button is invalid HTML that the keyboard can't reach.
export const ProductRowControl = ({ product, opened, onOpen, children }: ProductRowControl) => (
    <div className="group/row flex items-center pr-1">
        {/* The details open in a dialog, which aria-haspopup tells screen readers. aria-expanded says it's open, and
            keeps the actions button fully shown meanwhile (see rowActionsButtonClassName). The row keeps the
            default cursor, with a pointer only on the arrow. A small right padding, so the arrow sits as close to
            the menu (with the space inside its button) as the price does to the arrow. */}
        <UnstyledButton
            className="flex-1 min-w-0 flex items-center pl-4 pr-1 cursor-default"
            aria-haspopup="dialog"
            aria-expanded={opened}
            onClick={onOpen}
        >
            <span className="flex-1 min-w-0 overflow-hidden py-3">{children}</span>
            {/* Mantine's accordion arrow, as the rows used before, pointing right since nothing opens under the row */}
            <AccordionChevron size={24} className="shrink-0 -rotate-90 cursor-pointer" />
        </UnstyledButton>
        <ProductActionsMenu product={product} className={rowActionsButtonClassName} />
    </div>
)
