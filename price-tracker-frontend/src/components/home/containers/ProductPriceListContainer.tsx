import { type ProductType } from "../../../utils/Types"
import PriceBanner from "../price/PriceBanner"
import DeleteProductModal from "../modals/DeleteProductModal"
import EditProductModal from "../modals/EditProductModal"
import AddPriceModal from "../modals/AddPriceModal"
import Product from "../product/Product"
import PriceHistoryChart from "../price/PriceHistoryChart"
import PriceList from "../price/PriceList"
import { javaTimestampToJS } from "../../../utils/DateUtilities"
import { useToggleVisibility } from "../../../hooks/common/useToggleVisibility"
import { useEditProduct } from "../../../hooks/product/useEditProduct"
import { useDeleteProduct } from "../../../hooks/product/useDeleteProduct"
import { useAddPrice } from "../../../hooks/price/useAddPrice"
import { usePriceData } from "../../../hooks/price/usePriceData"
import { Accordion } from "@mantine/core"

type ProductProps = {
    product: ProductType
}

const ProductContainer = ({product}: ProductProps) => {

    // State for Product visibility
    const hideProduct = useToggleVisibility(false)

    // Hook for deleting products
    const deleteProduct = useDeleteProduct(product)
    // Hook for editing products
    const editProduct = useEditProduct(product)
    // Hook for price data
    const priceData = usePriceData(product)
    // Hook for adding prices
    const addPrice = useAddPrice(product, priceData.getHighestPrice(product.prices))

    // Toggle visibility of AddPriceModal (wrapper)
    const toggleShowAddPrice = () => {
        addPrice.priceDTO.setPriceDTO(prev => ({...prev, priceStarted: javaTimestampToJS(new Date(Date.now()).toISOString())}))
        addPrice.visibility.toggle()
    }

    if (hideProduct.value === true) return (<></>)

    return (
        <div className='h-full w-full border-t border-smoke flex flex-col gap-2 group'>
            <Accordion.Control>
                {/* Top content */}
                <div className='h-full w-full flex justify-between items-center pr-2'>
                    <Product
                        product={product}
                        toggleShowDelete={deleteProduct.visibility.toggle}
                        toggleShowEdit={editProduct.visibility.toggle}
                    />

                    <div className='flex gap-3 items-center font-bold'>
                        <PriceBanner
                            discountPercent={priceData.getMostRecentDiscount()}
                            bannerType={priceData.getBannerType()}
                            price={priceData.getMostRecentPrice()}
                        />
                    </div>
                    
                </div>
            </Accordion.Control>

            
            <Accordion.Panel>
                {/* Lower content */}
                <div className='w-full h-full flex justify-between gap-2'>
                    <PriceHistoryChart priceData={priceData.chartPriceData} />
                    <PriceList
                        sortedPrices={priceData.sortedPricesByDate}
                        toggleShowAddPrice={toggleShowAddPrice}
                        productId={product.productId}
                    />
                </div>
            </Accordion.Panel>

            <AddPriceModal
                hidden={addPrice.visibility.value}
                toggleHidden={addPrice.visibility.toggle}
                product={product}
                priceDTO={addPrice.priceDTO.value}
                setPriceDTO={addPrice.priceDTO.setPriceDTO}
                addPrice={addPrice.mutation.mutate}
            />

            <DeleteProductModal
                hidden={deleteProduct.visibility.value}
                toggleHidden={deleteProduct.visibility.toggle}
                product={product}
                deleteProduct={deleteProduct.mutation.mutate}
            />

            <EditProductModal
                hidden={editProduct.visibility.value}
                toggleHidden={editProduct.visibility.toggle}
                editProduct={editProduct.mutation.mutate}
                productDTO={editProduct.productDTO.value}
                setProductDTO={editProduct.productDTO.setProductDTO}
            />

        </div>
    )
}

export default ProductContainer