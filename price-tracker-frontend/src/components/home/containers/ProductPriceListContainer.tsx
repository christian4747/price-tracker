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
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEditProduct } from "../../../hooks/useEditProduct"

type ProductProps = {
    product: ProductType
}

const ProductContainer = ({product}: ProductProps) => {
    // State for Product visibility
    const hideProduct = useToggleVisibility(false)
    // State for Product's lower content visibility
    const hideLowerContent = useToggleVisibility(true)
    // State for DeleteProductModal visibility
    const showDeleteProduct = useToggleVisibility(false)
    // State for AddPriceModal visibility
    const showAddPrice = useToggleVisibility(false)

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

    const editProduct = useEditProduct(product)

    // Get the Product's Price(s) sorted
    const sortedPricesByDate = sortPricesByDateAscending(product.prices)

    // Get the Product's Price(s) sorted by amount in ascending order
    const getSortedPricesByAmount = () => {
        if (!product.prices) return []

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
        if (!product.prices || product.prices.length <= 0) return []

        const priceData = sortedPricesByDate
            .map((price) => {
                return {
                    priceId: price.priceId,
                    priceStarted: getUSDateStringFromTimestamp(price.priceStarted),
                    price: price.amount
                }
            }
        )

        priceData.push(
            {
                priceId: -1,
                priceStarted: 'Today',
                price: sortedPricesByDate[sortedPricesByDate.length - 1].amount
            }
        )

        return priceData
    }

    // Toggle visibility of AddPriceModal
    const toggleShowAddPrice = () => {
        priceDTO.setPriceDTO(prev => ({...prev, priceStarted: javaTimestampToJS(new Date(Date.now()).toISOString())}))
        showAddPrice.toggle()
    }

    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for deleting products
    const deleteProductMutation = useMutation({
        mutationFn: () => {
            showDeleteProduct.toggle()
            return api.deleteProduct(product.productId)
        },
        onSuccess: () => {
            queryClient.setQueryData(['products'], (old: any) => {
                const idx = old.indexOf(product)
                return old.filter((p: ProductType, i: number) => {
                    if (i === idx) {
                        return
                    }
                    return p
                })
            })
        },
        onError: (error) => {
            console.log(`Error occurred while deleting ${product.productId}: ${product.name} (${error.message})`)
        }
    })

    // Mutation for adding prices
    const addPriceMutation = useMutation({
        mutationFn: () => {
            toggleShowAddPrice()
            return api.addPrice(priceDTO.value)
        },
        onSuccess: (newData) => {
            priceDTO.resetPriceDTO()
            queryClient.setQueryData(['products'], (old: any) => {
                const idx = old.indexOf(product)
                return old.map((p: ProductType, i: number) => {
                    if (i === idx) {
                        return p.prices ? {...p, prices: [...p.prices, newData]} : {...p, prices: [newData]}
                    }
                    return p
                })
            })
        },
        onError: (error) => {
            console.log(`Error occurred while adding ${priceDTO} (${error.message})`)
        }
    })

    // Calculates the percentage from the given float
    // Percentages below 1 percent include 2 decimal points
    const getPercentage = (float: number) => {
        const percentage = parseFloat((float * 100).toFixed(2))
        return percentage > 1 ? Math.round(percentage) : percentage
    }

    // Gets the discount percentage for the most recent Price
    const getMostRecentDiscount = () => {
        const sortedByPrice = getSortedPricesByAmount()

        if (sortedByPrice.length <= 1 || sortedPricesByDate.length <= 1) return 0

        const highest = sortedByPrice[sortedByPrice.length - 1]
        const recent = sortedPricesByDate[sortedPricesByDate.length - 1]

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

        const allTimeDiscount = getBestDiscount(sortedPricesByDate)
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
                        toggleShowEdit={editProduct.visibility.toggle}
                    />

                    <div className='flex gap-3 items-center font-mono font-bold'>
                        <PriceBanner
                            discountPercent={getMostRecentDiscount()}
                            bannerType={getBannerType()}
                            price={sortedPricesByDate ? sortedPricesByDate[0]?.amount : ''}
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

            <EditProductModal
                hidden={editProduct.visibility.value}
                toggleHidden={editProduct.visibility.toggle}
                editProduct={editProduct.mutation.mutate}
                productDTO={editProduct.productDTO.value}
                setProductDTO={editProduct.productDTO.setProductDTO}
            />

            <DeleteProductModal
                hidden={showDeleteProduct.value}
                toggleHidden={showDeleteProduct.toggle}
                product={product}
                deleteProduct={deleteProductMutation.mutate}
            />

            <AddPriceModal
                hidden={showAddPrice.value}
                toggleHidden={toggleShowAddPrice}
                product={product}
                priceDTO={priceDTO.value}
                setPriceDTO={priceDTO.setPriceDTO}
                addPrice={addPriceMutation.mutate}
            />
        </>
    )
}

export default ProductContainer