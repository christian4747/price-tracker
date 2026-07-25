import { useState } from "react"
import { type PriceType, type ProductType } from "../../../utils/Types"
import PriceBanner from "../price/PriceBanner"
import DeleteProductModal from "../modals/DeleteProductModal"
import EditProductModal from "../modals/EditProductModal"
import AddPriceModal from "../modals/AddPriceModal"
import ExpandButton from "../../common/ExpandButton"
import Product from "../product/Product"
import PriceHistoryChart from "../price/PriceHistoryChart"
import PriceList from "../price/PriceList"
import api from "../../../services/api"
import { filterPricesBeforeDate, getUSDateStringFromTimestamp, javaTimestampToJS, sortPricesByDateAscending } from "../../../utils/DateUtilities"
import { useToggleVisibility } from "../../../hooks/useToggleVisibility"
import { usePriceDTO } from "../../../hooks/usePriceDTO"
import { useProductDTO } from "../../../hooks/useProductDTO"

type ProductProps = {
    productDetails: ProductType
}

const ProductContainer = ({productDetails}: ProductProps) => {
    // State for Product visibility
    const hideProduct = useToggleVisibility(false)
    // State for Product's lower content visibility
    const hideLowerContent = useToggleVisibility(true)
    // State for EditProductModal visibility
    const showEditProduct = useToggleVisibility(false)
    // State for DeleteProductModal visibility
    const showDeleteProduct = useToggleVisibility(false)
    // State for AddPriceModal visibility
    const showAddPrice = useToggleVisibility(false)

    // State for current Product's details
    const [product, setProduct] = useState<ProductType>(productDetails)

    // State for ProductDTO when editing Products
    const productDTO = useProductDTO(
        {
            name: product.name,
            store: product.store,
            link: product.link
        }
    )

    // State for PriceDTO when adding Prices
    const priceDTO = usePriceDTO(
        {
            amount: '0.00',
            currency: '',
            priceStarted: '',
            priceEnded: '',
            productId: product.productId
        }
    )

    // Get the Product's Price(s) sorted
    const getSortedPrices = () => {
        return sortPricesByDateAscending(product.prices)
    }

    // Get the Product's Price(s) sorted by amount in ascending order
    const getSortedPricesByAmount = () => {
        return product.prices.toSorted((a, b) => {
            return parseFloat(a.amount) - parseFloat(b.amount)
        })
    }

    // Get an array of Price(s) up to one year ago in ascending order
    const getOneYearAgoPrices = () => {
        const oneYearAgo = new Date(Date.now())
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

        return sortPricesByDateAscending(filterPricesBeforeDate(product.prices, oneYearAgo))
    }

    // Get an array of Price(s) up to two years ago in ascending order
    const getTwoYearsAgoPrices = () => {
        const twoYearsAgo = new Date(Date.now())
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

        return sortPricesByDateAscending(filterPricesBeforeDate(product.prices, twoYearsAgo))
    }

    // Create Price data for PriceHistoryChart
    const createPriceData = () => {
        const sortedPrices = getSortedPrices()

        const priceData = sortedPrices
            .map((price) => {
                return {
                    priceId: price.priceId,
                    priceStarted: getUSDateStringFromTimestamp(price.priceStarted),
                    price: price.amount
                }
            }
        )

        if (product.prices.length > 0) {
            priceData.push(
                {
                    priceId: -1,
                    priceStarted: 'Today',
                    price: sortedPrices[sortedPrices.length - 1].amount
                }
            )
        }
        
        return priceData
    }

    // Toggle visibility of AddPriceModal
    const toggleShowAddPrice = () => {
        priceDTO.setPriceDTO(prev => ({...prev, priceStarted: javaTimestampToJS(new Date(Date.now()).toISOString())}))
        showAddPrice.toggle()
    }

    // API function for editing Products
    const editProduct = async () => {
        showEditProduct.toggle()
        try {
            const res = api.editProduct(product.productId, productDTO.value)
                .then(() => {
                    setProduct(prev => ({...prev, name: productDTO.value.name}))
                    setProduct(prev => ({...prev, store: productDTO.value.store}))
                    setProduct(prev => ({...prev, link: productDTO.value.link}))
                })

            console.log(res)
        } catch (err) {
            console.log(`Error occurred while updating ${product.productId}: ${product.name}`)
            console.log(err)
        }
    }

    // API function for deleting Products
    const deleteProduct = async () => {
        showDeleteProduct.toggle()
        try {
            const res = api.deleteProduct(product.productId)

            hideProduct.toggle()

            console.log(res)
        } catch (err) {
            console.log(`Error occurred while deleting ${product.productId}: ${product.name}`)
            console.log(err)
        }
    }

    // API function for adding Prices
    const addPrice = async () => {
        toggleShowAddPrice()
        try {
            const res = api.addPrice(priceDTO.value)
            .then((res) => {
                setProduct(prev => ({...prev, prices: [...prev.prices, res.data]}))
                priceDTO.resetPriceDTO()
            })
            
            console.log(res)
        } catch (err) {
            console.log(`Error occurred while adding ${priceDTO}`)
            console.log(err)
        }
    }

    // Calculates the percentage from the given float
    // Percentages below 1 percent include 2 decimal points
    const getPercentage = (float: number) => {
        const percentage = parseFloat((float * 100).toFixed(2))
        return percentage > 1 ? Math.round(percentage) : percentage
    }

    // Gets the discount percentage for the most recent Price
    const getMostRecentDiscount = () => {
        const sortedByPrice = getSortedPricesByAmount()
        const sortedByDate = getSortedPrices()

        if (sortedByPrice.length <= 1 || sortedByDate.length <= 1) return 0

        const highest = sortedByPrice[sortedByPrice.length - 1]
        const recent = sortedByDate[sortedByDate.length - 1]

        // console.log(highest.amount, recent.amount)
        return getPercentage(1 - (parseFloat(recent.amount) / parseFloat(highest.amount)))
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

    // Returns the banner type by comparing the best discount and most recent discount
    const getBannerType = () => {
        const mostRecentDiscount = getMostRecentDiscount()

        const allTimeDiscount = getBestDiscount(getSortedPrices())
        const twoYearDiscount = getBestDiscount(getTwoYearsAgoPrices())
        const oneYearDiscount = getBestDiscount(getOneYearAgoPrices())

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

    if (hideProduct.value === true) return (<></>)

    return (
        <>
            <div className='h-full w-full border border-smoke rounded-sm flex flex-col p-2 gap-2 group'>
                {/* Top content */}
                <div className='h-full w-full flex justify-between items-center'>
                    <Product
                        product={product}
                        toggleShowDelete={showDeleteProduct.toggle}
                        toggleShowEdit={showEditProduct.toggle}
                    />

                    <div className='flex gap-3 items-center font-mono font-bold'>
                        <PriceBanner
                            discountPercent={getMostRecentDiscount()}
                            bannerType={getBannerType()}
                            price={getSortedPrices()[product.prices.length - 1]?.amount}
                        />
                        <ExpandButton hidden={hideLowerContent.value} setHidden={hideLowerContent.toggle}/>
                    </div>
                    
                </div>

                {/* Lower content */}
                {hideLowerContent.value === false ?
                    <div className='w-full h-full flex justify-between gap-2'>
                        <PriceHistoryChart priceData={createPriceData()} />
                        <PriceList
                            product={product}
                            sortedPrices={getSortedPrices()}
                            toggleShowAddPrice={toggleShowAddPrice}
                            setProduct={setProduct}
                        />
                    </div>
                    : <></>
                }
            </div>

            <EditProductModal
                hidden={showEditProduct.value}
                toggleHidden={showEditProduct.toggle}
                editProduct={editProduct}
                productDTO={productDTO.value}
                setProductDTO={productDTO.setProductDTO}
            />

            <DeleteProductModal
                hidden={showDeleteProduct.value}
                toggleHidden={showDeleteProduct.toggle}
                product={product}
                deleteProduct={deleteProduct}
            />

            <AddPriceModal
                hidden={showAddPrice.value}
                toggleHidden={toggleShowAddPrice}
                product={product}
                priceDTO={priceDTO.value}
                setPriceDTO={priceDTO.setPriceDTO}
                addPrice={addPrice}
            />
        </>
    )
}

export default ProductContainer