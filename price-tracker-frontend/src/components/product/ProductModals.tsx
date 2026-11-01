import type { ProductType } from '@/types/product'
import { useDisclosure } from '@mantine/hooks'
import { useState, type ReactNode } from 'react'
import DeleteProductModal from './modals/DeleteProductModal'
import { EditProductModal } from './modals/EditProductModal'
import { PermanentlyDeleteProductModal } from './modals/PermanentlyDeleteProductModal'
import { DeleteProductContext, EditProductContext, PermanentlyDeleteProductContext } from './ProductContext'

interface ProductModals {
    children: ReactNode
}

// Lets the product rows inside it open the product modals through the product contexts
export const ProductModals = ({ children }: ProductModals) => {
    // Track state for currently selected product
    // No product is selected until a modal first opens, and the modals can handle that while they're closed
    const [currentProduct, setCurrentProduct] = useState(undefined as unknown as ProductType)
    // Track state of modal open/close
    const [editProductOpened, { open: openEditProduct, close: closeEditProduct }] = useDisclosure(false)
    const [deleteProductOpened, { open: openDeleteProduct, close: closeDeleteProduct }] = useDisclosure(false)
    const [
        permanentlyDeleteProductOpened,
        { open: openPermanentlyDeleteProduct, close: closePermanentlyDeleteProduct }
    ] = useDisclosure(false)

    const openEditProductModal = (product: ProductType) => {
        setCurrentProduct(product)
        openEditProduct()
    }

    const openDeleteProductModal = (product: ProductType) => {
        setCurrentProduct(product)
        openDeleteProduct()
    }

    const openPermanentlyDeleteProductModal = (product: ProductType) => {
        setCurrentProduct(product)
        openPermanentlyDeleteProduct()
    }

    return (
        <>
            <EditProductContext value={openEditProductModal}>
                <DeleteProductContext value={openDeleteProductModal}>
                    <PermanentlyDeleteProductContext value={openPermanentlyDeleteProductModal}>
                        {children}
                    </PermanentlyDeleteProductContext>
                </DeleteProductContext>
            </EditProductContext>

            {/* Modal Zone */}
            <EditProductModal product={currentProduct} closeEditProduct={closeEditProduct} opened={editProductOpened} />
            <DeleteProductModal
                product={currentProduct}
                closeDeleteProduct={closeDeleteProduct}
                opened={deleteProductOpened}
            />
            <PermanentlyDeleteProductModal
                product={currentProduct}
                closeModal={closePermanentlyDeleteProduct}
                opened={permanentlyDeleteProductOpened}
            />
        </>
    )
}
