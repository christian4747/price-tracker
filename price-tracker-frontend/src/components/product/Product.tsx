import { useContext, useState } from "react";
import { Line, LineChart, Tooltip, XAxis } from "recharts";
import { FaLink } from "react-icons/fa6";
import { MdExpandMore, MdEdit, MdDelete } from "react-icons/md";
import Button from "../common/Button";
import { FiPlus } from "react-icons/fi";
import { ModalContext } from "../../App";
import Price from "../price/Price";
import PriceBanner from "../price/PriceBanner";

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

type ProductProps = {
    productName: string,
    price: number,
    bannerType?: 'one-year' | 'two-year' | 'all-time',
    discountPercent: number
}

const Product = (props: ProductProps) => {
    const {setModalSettings} = useContext(ModalContext) as ModalContext
    const [hideLowerContent, setHideLowerContent] = useState(true);

    const sampleData = [
        {
            priceStarted: "January 1st, 2026",
            price: 9.99
        },
        {
            priceStarted: "February 1st, 2026",
            price: 4.99
        },
        {
            priceStarted: "March 1st, 2026",
            price: 4.99
        },
        {
            priceStarted: "April 1st, 2026",
            price: props.price
        },
        {
            priceStarted: "Today",
            price: props.price
        }
    ]

    const priceBanner =
        props.bannerType ?
        <PriceBanner discountPercent={props.discountPercent} bannerType={props.bannerType} price={props.price} />
        : <PriceBanner discountPercent={props.discountPercent} price={props.price} />

    return (
        <>
            <div className='h-full w-full border-1 border-[#BCBBBD] rounded-sm flex flex-col p-2 gap-2 group'>
                {/* Top content */}
                <div className='h-full w-full flex justify-between items-center'>
                    <div className='flex gap-3 items-baseline-last'>
                        <div className="font-bold text-3xl font-mono">
                            {props.productName}
                        </div>
                        <div className="font-mono">
                            Store
                        </div>
                        <a className="cursor-pointer" href="http://localhost:5173/" target="_blank">
                            <FaLink />
                        </a>
                        <div className="hidden group-hover:block cursor-pointer" onClick={() => setModalSettings(prev => ({...prev, editProductHidden: false}))}>
                            <MdEdit />
                        </div>
                        <div className="hidden group-hover:block cursor-pointer" onClick={() => setModalSettings(prev => ({...prev, deleteProductHidden: false}))}>
                            <MdDelete />
                        </div>
                    </div>

                    <div className='flex gap-3 items-center font-mono font-bold'>
                        {priceBanner}
                        <ExpandButton hidden={hideLowerContent} setHidden={setHideLowerContent}/>
                    </div>
                    
                </div>

                {/* Lower content */}
                {!hideLowerContent && <div className='w-full h-full flex justify-between gap-2'>
                    <div className='w-7/10 border-1 border-[#BCBBBD] rounded-sm p-1'>
                        <LineChart style={{ width: '100%', aspectRatio: 3}} responsive data={sampleData}>
                            <XAxis dataKey="priceStarted" />
                            <Line type="stepAfter" dataKey="price" />
                            <Tooltip />
                        </LineChart>
                    </div>
                    <div className='flex flex-col w-3/10 border-1 border-[#BCBBBD] rounded-sm overflow-hidden justify-between'>
                        <div className='flex flex-col overflow-hidden bg-[#BCBBBD] font-bold font-mono'>
                            <Price 
                                price={9.99}
                                priceStarted={'04/01/26'}
                                setModalSettings={setModalSettings}
                            />
                            <Price 
                                price={4.99}
                                priceStarted={'03/01/26'}
                                setModalSettings={setModalSettings}
                            />
                            <Price 
                                price={4.99}
                                priceStarted={'02/01/26'}
                                setModalSettings={setModalSettings}
                            />
                            <Price 
                                price={9.99}
                                priceStarted={'01/01/26'}
                                setModalSettings={setModalSettings}
                            />
                        </div>
                        <Button
                            onClick={() => {setModalSettings(prev => ({...prev, addPriceHidden: false}))}}
                            className="mb-2 ml-2 mr-2"
                        >
                            <FiPlus size={24} />
                        </Button>
                    </div>
                </div>}
            </div>
        </>
    )
}

export default Product