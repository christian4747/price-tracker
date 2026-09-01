import { Accordion } from "@mantine/core"
import type { ProductType } from "../../../utils/Types"
import { useDebounce } from "@/hooks/common/useDebounce"
import { Product } from "./Product"
import DeleteProductModal from "../modals/DeleteProductModal"
import { EditProductModal } from "../modals/EditProductModal"
import { useState } from "react"
import { useDisclosure } from "@mantine/hooks"
import { useProductPage } from "@/hooks/product/useProductPage"
import { ProductListFooter } from "./ProductListFooter"
import { DeleteProductContext, EditProductContext } from "@/context/ProductContext"
import ProductListSkeleton from "./ProductListSkeleton"

export interface ProductList {
    productStatusFilter: string
    searchedTerm: string
}

// TODO: Use productStatusFilter and searchedTerm for product list
export const ProductList = ({}: ProductList) => {

    // Hook for getting products grouped
    const {
        changePageNumber,
        currentlyOpened,
        currentPageNumber,
        query,
        setCurrentlyOpened
    } = useProductPage()

    // Debounce for setting list's today's date state
    const { value: dateToday, setValueWithDebounce: setDateToday } = useDebounce(new Date())

    // Track state for currently selected product
    const [currentProduct, setCurrentProduct] = useState<ProductType>(query.data?.content[0])
    // Track state of modal open/close
    const [editProductOpened, { open: openEditProduct, close: closeEditProduct }] = useDisclosure(false)
    const [deleteProductOpened, { open: openDeleteProduct, close: closeDeleteProduct }] = useDisclosure(false)

    const openEditProductModal = (product: ProductType) => {
        setCurrentProduct(product)
        openEditProduct()
    }

    const openDeleteProductModal = (product: ProductType) => {
        setCurrentProduct(product)
        openDeleteProduct()
    }

    if (query.isLoading) return <ProductListSkeleton />
    if (!query.isSuccess) return <></>

    return (
        <>
            <div className="flex pb-5 flex-col mb-15">
                <Accordion
                    multiple
                    variant="unstyled"
                    styles={{
                        control: { cursor: 'default' },
                        chevron: { cursor: 'pointer' },
                    }}
                    chevronIconSize={24}
                    value={currentlyOpened}
                    onChange={setCurrentlyOpened}
                >
                    <EditProductContext value={openEditProductModal}>
                        <DeleteProductContext value={openDeleteProductModal}>
                            {query.data.content.map((product: ProductType, idx: number) => {
                                return (
                                    <Accordion.Item value={`item-${idx}`} key={product.name + product.store}>
                                        <Product
                                            product={product}
                                            dateToday={dateToday}
                                            setDateToday={setDateToday}
                                        />
                                    </Accordion.Item>
                                )
                            })}
                        </DeleteProductContext>
                    </EditProductContext>
                </Accordion>

                <ProductListFooter
                    total={query.data.count}
                    value={currentPageNumber}
                    onChange={changePageNumber}
                />

                {/* Modal Zone */}
                <EditProductModal product={currentProduct} closeEditProduct={closeEditProduct} opened={editProductOpened} />
                <DeleteProductModal product={currentProduct} closeDeleteProduct={closeDeleteProduct} opened={deleteProductOpened} />
            </div>
        </>
    )
}