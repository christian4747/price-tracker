import { type PriceType, type ProductType } from "../../../utils/Types"
import PriceBanner from "../price/PriceBanner"
import DeleteProductModal from "../modals/DeleteProductModal"
import EditProductModal from "../modals/EditProductModal"
import AddPriceModal from "../modals/AddPriceModal"
import ExpandButton from "../../common/ExpandButton"
import Product from "../product/Product"
import PriceHistoryChart from "../price/PriceHistoryChart"
import PriceList from "../price/PriceList"
import { filterPricesBeforeDate, getUSDateStringFromTimestamp, javaTimestampToJS, sortPricesByDateAscending } from "../../../utils/DateUtilities"
import { useToggleVisibility } from "../../../hooks/common/useToggleVisibility"
import { useEditProduct } from "../../../hooks/product/useEditProduct"
import { useDeleteProduct } from "../../../hooks/product/useDeleteProduct"
import { useAddPrice } from "../../../hooks/price/useAddPrice"

type ProductProps = {
    product: ProductType
}

const ProductContainer = ({product}: ProductProps) => {

    // State for Product's lower content visibility
    const hideLowerContent = useToggleVisibility(true)
    // State for Product visibility
    const hideProduct = useToggleVisibility(false)

    // Hook for adding prices
    const addPrice = useAddPrice(product)
    // Hook for deleting products
    const deleteProduct = useDeleteProduct(product)
    // Hook for editing products
    const editProduct = useEditProduct(product)

    // Get the Product's Price(s) sorted
    const sortedPricesByDate = sortPricesByDateAscending(product.prices)

    // Create Price data for PriceHistoryChart
    const createPriceData = () => {
        if (!product.prices || product.prices.length <= 0) return []

        const priceData = sortedPricesByDate
            .map((price) => {
                return {
                    priceId: price.priceId,
                    priceStarted: getUSDateStringFromTimestamp(price.priceStarted),
                    price: price.amount,
                    description: price.description
                }
            }
        )

        priceData.push(
            {
                priceId: -1,
                priceStarted: 'Today',
                price: sortedPricesByDate[sortedPricesByDate.length - 1].amount,
                description: ''
            }
        )

        return priceData
    }

    // Returns the banner type by comparing the best discount and most recent discount
    const getBannerType = () => {
        const mostRecentDiscount = getMostRecentDiscount()

        const allTimeDiscount = getBestDiscount(sortedPricesByDate)
        const twoYearDiscount = getBestDiscount(getXYearAgoPrices(2))
        const oneYearDiscount = getBestDiscount(getXYearAgoPrices(1))

        // console.log(allTimeDiscount, twoYearDiscount, oneYearDiscount, mostRecentDiscount)

        if (allTimeDiscount === mostRecentDiscount) {
            return 'all-time'
        } else if (twoYearDiscount === mostRecentDiscount) {
            return 'two-year'
        } else if (oneYearDiscount === mostRecentDiscount) {
            return 'one-year'
        }
        return ''
    }

    // Gets the best discount found in the array of Prices
    const getBestDiscount = (prices: PriceType[]) => {
        if (prices.length <= 1) return 0

        let lowest = parseFloat(prices[0].amount)
        let highest = parseFloat(prices[0].amount)
        let profit = highest - lowest

        for (const price of prices) {
            const priceVal = parseFloat(price.amount)
            if (priceVal < lowest) {
                lowest = priceVal
                profit = highest - lowest
            } else if (priceVal > highest) {
                highest = priceVal
                profit = highest - lowest
            }
        }

        return getPercentage(profit / highest)
    }

    // Gets the discount percentage for the most recent Price
    const getMostRecentDiscount = () => {
        // Get the Product's Price(s) sorted by amount in ascending order
        const sortedByPrice = sortPricesByAmountAsc()

        if (sortedByPrice.length <= 1 || sortedPricesByDate.length <= 1) return 0

        const highest = sortedByPrice[sortedByPrice.length - 1]
        const recent = sortedPricesByDate[sortedPricesByDate.length - 1]

        // console.log(highest.amount, recent.amount)
        return getPercentage(1 - (parseFloat(recent.amount) / parseFloat(highest.amount)))
    }

    // Calculates the percentage from the given float
    // Percentages below 1 percent include 2 decimal points
    const getPercentage = (float: number) => {
        const percentage = parseFloat((float * 100).toFixed(2))
        return percentage > 1 ? Math.round(percentage) : percentage
    }

    // Get an array of Price(s) up to one year ago in ascending order
    const getXYearAgoPrices = (yearsAgo: number) => {
        const xYearAgo = new Date(Date.now())
        xYearAgo.setFullYear(xYearAgo.getFullYear() - yearsAgo)

        return sortPricesByDateAscending(filterPricesBeforeDate(product.prices, xYearAgo))
    }

    // Sort the given array by the given field (ascending)
    const sortPricesByAmountAsc = () => {
        if (!product.prices || product.prices.length === 0) return []
        if (product.prices.length <= 1) return product.prices

        return product.prices.toSorted((a, b) => {
            return parseFloat(a.amount) - parseFloat(b.amount)
        })
    }

    // Toggle visibility of AddPriceModal (wrapper)
    const toggleShowAddPrice = () => {
        addPrice.priceDTO.setPriceDTO(prev => ({...prev, priceStarted: javaTimestampToJS(new Date(Date.now()).toISOString())}))
        addPrice.visibility.toggle()
    }

    if (hideProduct.value === true) return (<></>)

    return (
        <>
            <div className='h-full w-full border border-smoke rounded-sm flex flex-col p-2 gap-2 group'>
                {/* Top content */}
                <div className='h-full w-full flex justify-between items-center'>
                    <Product
                        product={product}
                        toggleShowDelete={deleteProduct.visibility.toggle}
                        toggleShowEdit={editProduct.visibility.toggle}
                    />

                    <div className='flex gap-3 items-center font-mono font-bold'>
                        <PriceBanner
                            discountPercent={getMostRecentDiscount()}
                            bannerType={getBannerType()}
                            price={sortedPricesByDate ? sortedPricesByDate[sortedPricesByDate.length - 1]?.amount : ''}
                        />
                        <ExpandButton hidden={hideLowerContent.value} setHidden={hideLowerContent.toggle}/>
                    </div>
                    
                </div>

                {/* Lower content */}
                {hideLowerContent.value === false ?
                    <div className='w-full h-full flex justify-between gap-2'>
                        <PriceHistoryChart priceData={createPriceData()} />
                        <PriceList
                            sortedPrices={sortedPricesByDate}
                            toggleShowAddPrice={toggleShowAddPrice}
                            productId={product.productId}
                        />
                    </div>
                    : <></>
                }
            </div>

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
        </>
    )
}

export default ProductContainer