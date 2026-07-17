import React from 'react'
import { MdDelete, MdEdit } from 'react-icons/md'
import type { ModalSettings } from '../App'

type Props = {
    priceId?: number,
    price: number,
    priceStarted: string,
    setModalSettings: React.Dispatch<React.SetStateAction<ModalSettings>>
}

const Price = (props: Props) => {
    return (
        <div className="flex justify-between even:bg-[#F4F4F4] group/product">
            <div className="pl-2">
                {props.priceStarted}
            </div>
            <div className="pr-2 flex items-center gap-1">
                <div>${props.price}</div>
                <div className="hidden group-hover/product:block" onClick={() => props.setModalSettings(prev => ({...prev, editPriceHidden: false}))}>
                    <MdEdit />
                </div>
                <div className="hidden group-hover/product:block" onClick={() => props.setModalSettings(prev => ({...prev, deletePriceHidden: false}))}>
                    <MdDelete />
                </div>
            </div>
        </div>
    )
}

export default Price