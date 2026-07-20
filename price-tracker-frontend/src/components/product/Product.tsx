import { useState } from "react";
import { Line, LineChart, Tooltip, XAxis } from "recharts";
import { FaLink } from "react-icons/fa6";
import { MdExpandMore, MdEdit, MdDelete } from "react-icons/md";
import Button from "../common/Button";
import { FiPlus } from "react-icons/fi";
import { type ProductType } from "../../App";
import Price from "../price/Price";
import PriceBanner from "../price/PriceBanner";
import DeleteProductModal from "./DeleteProductModal";
import EditProductModal from "./EditProductModal";
import AddPriceModal from "../price/AddPriceModal";

type ExpandButtonProps = {
    hidden: boolean,
    setHidden: React.Dispatch<React.SetStateAction<boolean>>
}

const ExpandButton = ({hidden, setHidden}: ExpandButtonProps) => {
    return (
        <div className="cursor-pointer" onClick={() => {setHidden(!hidden)}}>
            <MdExpandMore className={hidden ? "transition duration-300" : "transition duration-300 rotate-180"} size={48} />
        </div>
    )
}

type ProductModalSettings = {
    showEditProduct: boolean,
    showDeleteProduct: boolean,
    showAddPrice: boolean
}

type ProductProps = {
    productDetails: ProductType,
    bannerType?: 'one-year' | 'two-year' | 'all-time',
    discountPercent?: number
}

const Product = ({productDetails, discountPercent, bannerType}: ProductProps) => {
    const [hideProduct, setHideProduct] = useState(false)
    const [hideLowerContent, setHideLowerContent] = useState(true)
    const [product, setProduct] = useState<ProductType>(productDetails)

    const [productModalSettings, setProductModalSettings] = useState<ProductModalSettings>(
        {
            showEditProduct: false,
            showDeleteProduct: false,
            showAddPrice: false,
        }
    )

    const getSortedPrices = () => {
        return product.prices.toSorted((a, b) => {
            return Date.parse(a.priceStarted) - Date.parse(b.priceStarted)
        })
    }

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

    const priceData = createPriceData()

    const priceBanner =
        bannerType ?
        <PriceBanner discountPercent={discountPercent} bannerType={bannerType} price={getSortedPrices()[product.prices.length - 1]?.amount} />
        : <PriceBanner discountPercent={discountPercent} price={getSortedPrices()[product.prices.length - 1]?.amount} />

    const toggleShowEdit = () => {
        setProductModalSettings(prev => ({...prev, showEditProduct: !prev.showEditProduct}))
    }

    const toggleShowDelete = () => {
        setProductModalSettings(prev => ({...prev, showDeleteProduct: !prev.showDeleteProduct}))
    }

    const toggleShowAddPrice = () => {
        setProductModalSettings(prev => ({...prev, showAddPrice: !prev.showAddPrice}))
    }

    if (hideProduct) return (<></>)

    return (
        <>
            <div className='h-full w-full border-1 border-[#BCBBBD] rounded-sm flex flex-col p-2 gap-2 group'>
                {/* Top content */}
                <div className='h-full w-full flex justify-between items-center'>
                    <div className='flex gap-3 items-baseline-last'>
                        <div className="font-bold text-3xl font-mono">
                            {product.name}
                        </div>
                        <div className="font-mono">
                            {product.store}
                        </div>
                        <a className="cursor-pointer" href={product.link} target="_blank">
                            <FaLink />
                        </a>
                        <div className="hidden group-hover:block cursor-pointer" onClick={toggleShowEdit}>
                            <MdEdit />
                        </div>
                        <div className="hidden group-hover:block cursor-pointer" onClick={toggleShowDelete}>
                            <MdDelete />
                        </div>
                    </div>

                    <div className='flex gap-3 items-center font-mono font-bold'>
                        {priceBanner}
                        <ExpandButton hidden={hideLowerContent} setHidden={setHideLowerContent}/>
                    </div>
                    
                </div>

                {/* Lower content */}
                {!hideLowerContent ? <div className='w-full h-full flex justify-between gap-2'>
                    <div className='w-7/10 border-1 border-[#BCBBBD] rounded-sm p-1'>
                        <LineChart style={{ width: '100%', aspectRatio: 3}} responsive data={priceData}>
                            <XAxis dataKey="priceStarted" />
                            <Line type="stepAfter" dataKey="price" />
                            <Tooltip />
                        </LineChart>
                    </div>
                    <div className='flex flex-col w-3/10 border-1 border-[#BCBBBD] rounded-sm overflow-hidden justify-between'>
                        <div className='flex flex-col overflow-hidden bg-[#BCBBBD] font-bold font-mono'>
                            {getSortedPrices()?.map((price) => {
                                price.productId = product.productId
                                return (
                                    <Price
                                        key={price.priceId}
                                        price={price}
                                        product={product}
                                        setProduct={setProduct}
                                    />
                                )
                            })}
                        </div>
                        <Button
                            onClick={toggleShowAddPrice}
                            className="mb-2 ml-2 mr-2"
                        >
                            <FiPlus size={24} />
                        </Button>
                    </div>
                </div> : <></>}
            </div>

            <EditProductModal
                hidden={productModalSettings.showEditProduct}
                toggleHidden={toggleShowEdit}
                product={product}
            />

            <DeleteProductModal
                hidden={productModalSettings.showDeleteProduct}
                toggleHidden={toggleShowDelete}
                product={product}
                setHideProduct={setHideProduct}
            />

            <AddPriceModal
                hidden={productModalSettings.showAddPrice}
                toggleHidden={toggleShowAddPrice}
                product={product}
                setProduct={setProduct}
            />
        </>
    )
}

export default Product