import { useContext, useState } from "react";
import { Line, LineChart, Tooltip, XAxis } from "recharts";
import { FaLink } from "react-icons/fa6";
import { MdExpandMore, MdEdit, MdDelete } from "react-icons/md";
import Button from "./Button";
import { FiPlus } from "react-icons/fi";
import { ModalContext, type Product } from "../App";

type Props = {
    price: number,
    banner: string
}

const Product = (props: Props) => {
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

    const getPrice = (banner: string) => {
        if (banner == '1') {
            return (
                <div className='flex gap-3 items-center'>
                    <div className='bg-[#2EBE65] text-[#F4F4F4] rounded-sm p-2 font-mono font-bold min-w-[130px] flex justify-center'>
                        1 YEAR LOW
                    </div>

                    <div className="font-mono font-bold text-[#2EBE65]">
                        -50%
                    </div>
                    <div className="font-mono font-bold">
                        $4.99
                    </div>
                    <div onClick={() => {setHideLowerContent(!hideLowerContent)}}>
                        <MdExpandMore className={hideLowerContent ? "transition duration-300" : "transition duration-300 rotate-180"} size={48} />
                    </div>
                </div>
            )
        } else if (banner == '2') {
            return (
                <div className='flex gap-3 items-center'>
                    <div className='bg-[#59BCE6] text-[#F4F4F4] rounded-sm p-2 font-mono font-bold min-w-[130px] flex justify-center'>
                        2 YEAR LOW
                    </div>

                    <div className="font-mono font-bold text-[#59BCE6]">
                        -80%
                    </div>
                    <div className="font-mono font-bold">
                        $1.99
                    </div>
                    <div onClick={() => {setHideLowerContent(!hideLowerContent)}}>
                        <MdExpandMore className={hideLowerContent ? "transition duration-300" : "transition duration-300 rotate-180"} size={48} />
                    </div>
                </div>
            )
        } else if (banner == '3') {
            return (
                <div className='flex gap-3 items-center'>
                    <div className='bg-[#F0585A] text-[#F4F4F4] rounded-sm p-2 font-mono font-bold min-w-[130px] flex justify-center'>
                        LOWEST EVER
                    </div>

                    <div className="font-mono font-bold text-[#F0585A]">
                        -90%
                    </div>
                    <div className="font-mono font-bold">
                        $0.99
                    </div>
                    <div onClick={() => {setHideLowerContent(!hideLowerContent)}}>
                        <MdExpandMore className={hideLowerContent ? "transition duration-300" : "transition duration-300 rotate-180"} size={48} />
                    </div>
                </div>
            )
        } else if (banner == '4') {
            return (
                <div className='flex gap-3 items-center'>
                    <div className="font-mono font-bold text-[#2EBE65]">
                        -50%
                    </div>
                    <div className="font-mono font-bold">
                        ${props.price}
                    </div>
                    <div onClick={() => {setHideLowerContent(!hideLowerContent)}}>
                        <MdExpandMore className={hideLowerContent ? "transition duration-300" : "transition duration-300 rotate-180"} size={48} />
                    </div>
                </div>
            )
        } else if (banner == '5') {
            return (
                <div className='flex gap-3 items-center'>
                    <div className="font-mono font-bold">
                        -10%
                    </div>
                    <div className="font-mono font-bold">
                        ${props.price}
                    </div>
                    <div onClick={() => {setHideLowerContent(!hideLowerContent)}}>
                        <MdExpandMore className={hideLowerContent ? "transition duration-300" : "transition duration-300 rotate-180"} size={48} />
                    </div>
                </div>
            )
        } else {
            return (
                <div className='flex gap-3 items-center'>
                    <div className="font-mono font-bold">
                        ${props.price}
                    </div>
                    <div onClick={() => {setHideLowerContent(!hideLowerContent)}}>
                        <MdExpandMore className={hideLowerContent ? "transition duration-300" : "transition duration-300 rotate-180"} size={48} />
                    </div>
                </div>
            )
        }
    }

    const price = getPrice(props.banner)

    return (
        <>
            <div className='h-full w-full border-1 border-[#BCBBBD] rounded-sm flex flex-col p-2 gap-2 group'>
                {/* Top content */}
                <div className='h-full w-full flex justify-between items-center'>
                    <div className='flex gap-3 items-baseline-last'>
                        <div className="font-bold text-3xl font-mono">
                            Product {props.banner}
                        </div>
                        <div className="font-mono">
                            Store
                        </div>
                        <div>
                            <FaLink />
                        </div>
                        <div className="hidden group-hover:block" onClick={() => setModalSettings(prev => ({...prev, editProductHidden: false}))}>
                            <MdEdit />
                        </div>
                        <div className="hidden group-hover:block" onClick={() => setModalSettings(prev => ({...prev, deleteProductHidden: false}))}>
                            <MdDelete />
                        </div>
                    </div>

                    {price}
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
                            <div className="flex justify-between even:bg-[#F4F4F4] group/product">
                                <div className="pl-2">
                                    04/01/26
                                </div>
                                <div className="pr-2 flex items-center gap-1">
                                    <div>${props.price}</div>
                                    <div className="hidden group-hover/product:block" onClick={() => setModalSettings(prev => ({...prev, editPriceHidden: false}))}>
                                        <MdEdit />
                                    </div>
                                    <div className="hidden group-hover/product:block" onClick={() => setModalSettings(prev => ({...prev, deletePriceHidden: false}))}>
                                        <MdDelete />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between even:bg-[#F4F4F4] group/product">
                                <div className="pl-2">
                                    03/01/26
                                </div>
                                <div className="pr-2 flex items-center gap-1">
                                    <div>$4.99</div>
                                    <div className="hidden group-hover/product:block" onClick={() => setModalSettings(prev => ({...prev, editPriceHidden: false}))}>
                                        <MdEdit />
                                    </div>
                                    <div className="hidden group-hover/product:block" onClick={() => setModalSettings(prev => ({...prev, deletePriceHidden: false}))}>
                                        <MdDelete />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between even:bg-[#F4F4F4] group/product">
                                <div className="pl-2">
                                    02/01/26
                                </div>
                                <div className="pr-2 flex items-center gap-1">
                                    <div>$4.99</div>
                                    <div className="hidden group-hover/product:block" onClick={() => setModalSettings(prev => ({...prev, editPriceHidden: false}))}>
                                        <MdEdit />
                                    </div>
                                    <div className="hidden group-hover/product:block" onClick={() => setModalSettings(prev => ({...prev, deletePriceHidden: false}))}>
                                        <MdDelete />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between even:bg-[#F4F4F4] group/product">
                                <div className="pl-2">
                                    01/01/26
                                </div>
                                <div className="pr-2 flex items-center gap-1">
                                    <div>$9.99</div>
                                    <div className="hidden group-hover/product:block" onClick={() => setModalSettings(prev => ({...prev, editPriceHidden: false}))}>
                                        <MdEdit />
                                    </div>
                                    <div className="hidden group-hover/product:block" onClick={() => setModalSettings(prev => ({...prev, deletePriceHidden: false}))}>
                                        <MdDelete />
                                    </div>
                                </div>
                            </div>
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