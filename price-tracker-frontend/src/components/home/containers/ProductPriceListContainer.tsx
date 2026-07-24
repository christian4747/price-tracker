import { useState } from "react"
import { type PriceDTO, type PriceType, type ProductDTO, type ProductType } from "../../../utils/Types"
import PriceBanner from "../price/PriceBanner"
import DeleteProductModal from "../modals/DeleteProductModal"
import EditProductModal from "../modals/EditProductModal"
import AddPriceModal from "../modals/AddPriceModal"
import ExpandButton from "../../common/ExpandButton"
import Product from "../product/Product"
import PriceHistoryChart from "../price/PriceHistoryChart"
import PriceList from "../price/PriceList"
import api from "../../../services/api"

type ProductModalSettings = {
    showEditProduct: boolean,
    showDeleteProduct: boolean,
    showAddPrice: boolean
}

type ProductProps = {
    productDetails: ProductType
}

const ProductContainer = ({productDetails}: ProductProps) => {
    // State for Product visibility
    const [hideProduct, setHideProduct] = useState(false)

    // State for Product's lower content visibility
    const [hideLowerContent, setHideLowerContent] = useState(true)

    // State for current Product's details
    const [product, setProduct] = useState<ProductType>(productDetails)

    // State for EditProductModal, DeleteProductModal, and AddPriceModal visibility
    const [productModalSettings, setProductModalSettings] = useState<ProductModalSettings>(
        {
            showEditProduct: false,
            showDeleteProduct: false,
            showAddPrice: false,
        }
    )

    // State for ProductDTO when editing Products
    const [productDTO, setProductDTO] = useState<ProductDTO>(
        {
            name: product.name,
            store: product.store,
            link: product.link
        }
    )

    // State for PriceDTO when adding Prices
    const [priceDTO, setPriceDTO] = useState<PriceDTO>(
        {
            amount: 0,
            currency: '',
            priceStarted: '',
            priceEnded: '',
            productId: product.productId
        }
    )

    // Reset PriceDTO after adding a Price
    const resetPriceDTO = () => {
        setPriceDTO({amount: 0, currency: '', priceStarted: '', priceEnded: '', productId: product.productId})
    }

    // Get the Product's Price(s) sorted
    const getSortedPrices = () => {
        return product.prices.toSorted((a, b) => {
            return Date.parse(a.priceStarted) - Date.parse(b.priceStarted)
        })
    }

    const getLastYearPrices = () => {
        const today = new Date(Date.now())
        today.setFullYear(today.getFullYear() - 1)

        return product.prices.filter((price) => {
            if (Date.parse(price.priceStarted) > Date.parse(today.toUTCString())) {
                return price
            }
        })
    }

    const getSortedLastYear = () => {
        return getLastYearPrices().toSorted((a, b) => {
            return Date.parse(a.priceStarted) - Date.parse(b.priceStarted)
        })
    }

    // Get the Product's Price(s) sorted by amount (descending)
    const getSortedPricesByAmount = () => {
        return product.prices.toSorted((a, b) => {
            return parseFloat(a.amount) - parseFloat(b.amount)
        })
    }

    // Create Price data for PriceHistoryChart
    const createPriceData = () => {
        const sortedPrices = getSortedPrices()
        const priceData = sortedPrices
            .map((price) => {
                const priceStartedDate = new Date(price.priceStarted)

                return {priceId: price.priceId, priceStarted: `${priceStartedDate.getMonth() + 1}/${priceStartedDate.getDate()}/${priceStartedDate.getFullYear()}`, price: price.amount}
            }
        )
        if (product.prices.length > 0) {
            priceData.push({priceId: -1, priceStarted: 'Today', price: sortedPrices[sortedPrices.length - 1].amount})
        }
        
        return priceData
    }

    // Toggle visiblity of EditProductModal
    const toggleShowEdit = () => {
        setProductModalSettings(prev => ({...prev, showEditProduct: !prev.showEditProduct}))
    }

    // Toggle visiblity of DeleteProductModal
    const toggleShowDelete = () => {
        setProductModalSettings(prev => ({...prev, showDeleteProduct: !prev.showDeleteProduct}))
    }

    // Toggle visibility of AddPriceModal
    const toggleShowAddPrice = () => {
        setProductModalSettings(prev => ({...prev, showAddPrice: !prev.showAddPrice}))
    }

    // API function for editing Products
    const editProduct = async () => {
        toggleShowEdit()
        try {
            const res = api.editProduct(product.productId, productDTO)
                .then(() => {
                    setProduct(prev => ({...prev, name: productDTO.name}))
                    setProduct(prev => ({...prev, store: productDTO.store}))
                    setProduct(prev => ({...prev, link: productDTO.link}))
                })

            console.log(res)
        } catch (err) {
            console.log(`Error occurred while updating ${product.productId}: ${product.name}`)
            console.log(err)
        }
    }

    // API function for deleting Products
    const deleteProduct = async () => {
        toggleShowDelete()
        try {
            const res = api.deleteProduct(product.productId)

            setHideProduct(true)

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
            const res = api.addPrice(priceDTO)
            .then((res) => {
                setProduct(prev => ({...prev, prices: [...prev.prices, res.data]}))
                resetPriceDTO()
            })
            
            console.log(res)
        } catch (err) {
            console.log(`Error occurred while adding ${priceDTO}`)
            console.log(err)
        }
    }

    // Gets the discount percentage for the most recent Price
    const getMostRecentDiscount = () => {
        const sortedByPrice = getSortedPricesByAmount()
        const sortedByDate = getSortedPrices()

        if (sortedByPrice.length <= 1 || sortedByDate.length <= 1) return 0

        const highest = sortedByPrice[sortedByPrice.length - 1]
        const recent = sortedByDate[sortedByDate.length - 1]

        // console.log(highest.amount, recent.amount)
        const ratio = Math.round((1 - (parseFloat(recent.amount) / parseFloat(highest.amount))) * 100)
        return ratio
    }

    const getBestDiscount = (prices: PriceType[]) => {
        if (prices.length <= 1) return '' 

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

        return Math.round((profit / highest) * 100)
    }

    // Returns the banner type by comparing the best discount and most recent discount
    const getBannerType = () => {
        const mostRecentDiscount = getMostRecentDiscount()
        const allTimeDiscount = getBestDiscount(getSortedPrices())
        const oneYearDiscount = getBestDiscount(getSortedLastYear())
        console.log(oneYearDiscount)

        if (allTimeDiscount === mostRecentDiscount) {
            return 'all-time'
        } else if (oneYearDiscount === mostRecentDiscount) {
            return 'one-year'
        }
        return ''
    }

    if (hideProduct) return (<></>)

    return (
        <>
            <div className='h-full w-full border-1 border-[#BCBBBD] rounded-sm flex flex-col p-2 gap-2 group'>
                {/* Top content */}
                <div className='h-full w-full flex justify-between items-center'>
                    <Product
                        product={product}
                        toggleShowDelete={toggleShowDelete}
                        toggleShowEdit={toggleShowEdit}
                    />

                    <div className='flex gap-3 items-center font-mono font-bold'>
                        <PriceBanner
                            discountPercent={getMostRecentDiscount()}
                            bannerType={getBannerType()}
                            price={getSortedPrices()[product.prices.length - 1]?.amount}
                        />
                        <ExpandButton hidden={hideLowerContent} setHidden={setHideLowerContent}/>
                    </div>
                    
                </div>

                {/* Lower content */}
                {!hideLowerContent ?
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
                hidden={productModalSettings.showEditProduct}
                toggleHidden={toggleShowEdit}
                editProduct={editProduct}
                productDTO={productDTO}
                setProductDTO={setProductDTO}
            />

            <DeleteProductModal
                hidden={productModalSettings.showDeleteProduct}
                toggleHidden={toggleShowDelete}
                product={product}
                deleteProduct={deleteProduct}
            />

            <AddPriceModal
                hidden={productModalSettings.showAddPrice}
                toggleHidden={toggleShowAddPrice}
                product={product}
                priceDTO={priceDTO}
                setPriceDTO={setPriceDTO}
                addPrice={addPrice}
            />
        </>
    )
}

export default ProductContainer