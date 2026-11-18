import type { ProductBody } from '@/types/product'
import { useDisclosure } from '@mantine/hooks'
import { ProductTitleBar } from './ProductTitleBar'
import { ProductDetails } from './ProductDetails'
import { ProductDetailsModal } from './ProductDetailsModal'
import { ProductActionsMenu } from './ProductActionsMenu'
import { ProductRowControl } from './ProductRowControl'

export interface Product {
    dateToday: Date
    productBody: ProductBody
    setDateToday: (newVal: Date) => void
}

// A product's row in the list, which opens the product's details in a modal
export const Product = ({ productBody, dateToday, setDateToday }: Product) => {
    // Kept here, so it follows the product (its key in the list) when products are added or removed around it
    const [detailsOpened, { open: openDetails, close: closeDetails }] = useDisclosure(false)

    return (
        <div className="h-full w-full border-b border-smoke flex flex-col">
            <ProductRowControl product={productBody.product} opened={detailsOpened} onOpen={openDetails}>
                {/* Top content */}
                <ProductTitleBar productBody={productBody} dateToday={dateToday} setDateToday={setDateToday} />
            </ProductRowControl>

            <ProductDetailsModal
                opened={detailsOpened}
                onClose={closeDetails}
                // The row's title bar, with room to show the whole title
                header={
                    <ProductTitleBar productBody={productBody} dateToday={dateToday} setDateToday={setDateToday} wrap />
                }
                // The window covers the row's own menu, so the product's actions come along
                actions={<ProductActionsMenu product={productBody.product} />}
            >
                <ProductDetails dateToday={dateToday} productBody={productBody} setDateToday={setDateToday} />
            </ProductDetailsModal>
        </div>
    )
}
