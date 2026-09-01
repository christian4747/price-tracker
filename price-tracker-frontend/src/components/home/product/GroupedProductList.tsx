import { Accordion } from "@mantine/core"
import type { ProductType } from "../../../utils/Types"
import { useDebounce } from "@/hooks/common/useDebounce"
import { GroupedProduct } from "./GroupedProduct"
import { useState } from "react"
import { useDisclosure } from "@mantine/hooks"
import DeleteProductModal from "../modals/DeleteProductModal"
import { EditProductModal } from "../modals/EditProductModal"
import { ProductListFooter } from "./ProductListFooter"
import { useProductPageGrouped } from "@/hooks/product/useProductPageGrouped"
import { DeleteProductContext, EditProductContext } from "@/context/ProductContext"
import ProductListSkeleton from "./ProductListSkeleton"

interface GroupedProductData {
    name: string
    products: ProductType[]
}

export interface GroupedProductList {
    searchedTerm: string
}

// TODO: Add a formatter
// TODO: Look into memoizing
export const GroupedProductList = ({}: GroupedProductList) => {

    // Hook for getting products grouped
    const {
        changePageNumber,
        currentlyOpened,
        currentPageNumber,
        query,
        setCurrentlyOpened
    } = useProductPageGrouped()

    // Debounce for setting list's today's date state
    const { value: dateToday, setValueWithDebounce: setDateToday } = useDebounce(new Date())
    
    // Track state for currently selected product
    const [currentProduct, setCurrentProduct] = useState<ProductType>(query.data?.content[0]?.products[0])
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
                    {query.data.content.map((groupedProduct: GroupedProductData, idx: number) => {
                        return (
                            <EditProductContext value={openEditProductModal}>
                                <DeleteProductContext value={openDeleteProductModal}>
                                    <Accordion.Item value={`item-${idx}`} key={groupedProduct.name}>
                                        <GroupedProduct
                                            products={groupedProduct.products}
                                            dateToday={dateToday}
                                            setDateToday={setDateToday}
                                        />
                                    </Accordion.Item>
                                </DeleteProductContext>
                            </EditProductContext>
                        )
                    })}
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