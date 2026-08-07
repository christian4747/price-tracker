import { type ProductType } from "@/utils/Types"
import PriceBanner from "../price/PriceBanner"
import EditProductModal from "../modals/EditProductModal"
import Product from "../product/Product"
import PriceHistoryChart from "../price/PriceHistoryChart"
import PriceList from "../price/PriceList"
import { useToggleVisibility } from "@/hooks/common/useToggleVisibility"
import { useEditProduct } from "@/hooks/product/useEditProduct"
import { usePriceData } from "@/hooks/price/usePriceData"
import { Accordion } from "@mantine/core"

type ProductProps = {
    product: ProductType
}

const ProductContainer = ({product}: ProductProps) => {

    // State for Product visibility
    const hideProduct = useToggleVisibility(false)

    // Hook for editing products
    const editProduct = useEditProduct(product)
    // Hook for price data
    const priceData = usePriceData(product)

    if (hideProduct.value === true) return (<></>)

    return (
        <div className='h-full w-full border-t border-smoke flex flex-col gap-2 group'>
            <Accordion.Control>
                {/* Top content */}
                <div className='h-full w-full flex justify-between items-center pr-2'>
                    <Product
                        product={product}
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
                        product={product}
                    />
                </div>
            </Accordion.Panel>

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