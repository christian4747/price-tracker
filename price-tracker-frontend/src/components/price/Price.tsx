import { useState } from 'react'
import { MdDelete, MdEdit } from 'react-icons/md'
import EditPriceModal from './EditPriceModal'
import DeletePriceModal from './DeletePriceModal'
import type { PriceType, ProductType } from '../../App'

type PriceModalSettings = {
    showEditPrice: boolean,
    showDeletePrice: boolean
}

type PriceProps = {
    price: PriceType,
    product: ProductType,
    setProduct: React.Dispatch<React.SetStateAction<ProductType>>
}

const Price = ({price, setProduct}: PriceProps) => {
    const [priceModalSettings, setPriceModalSettings] = useState<PriceModalSettings>
    (
        {
            showEditPrice: false,
            showDeletePrice: false
        }
    )

    const toggleShowEdit = () => {
        setPriceModalSettings(prev => ({...prev, showEditPrice: !prev.showEditPrice}))
    }

    const toggleShowDelete = () => {
        setPriceModalSettings(prev => ({...prev, showDeletePrice: !prev.showDeletePrice}))
    }

    const priceStartedDate = new Date(price.priceStarted)
    const priceStartedDateString = `${priceStartedDate.getMonth() + 1}/${priceStartedDate.getDate()}/${priceStartedDate.getFullYear()}`

    return (
        <>
            <div className="flex justify-between even:bg-[#F4F4F4] group/product">
                <div className="pl-2">
                    {priceStartedDateString}
                </div>
                <div className="pr-2 flex items-center gap-1">
                    <div>${price.amount}</div>
                    <div
                        className="hidden group-hover/product:block cursor-pointer"
                        onClick={() => setPriceModalSettings(prev => ({...prev, showEditPrice: !prev.showEditPrice}))}
                    >
                        <MdEdit />
                    </div>
                    <div
                        className="hidden group-hover/product:block cursor-pointer"
                        onClick={() => setPriceModalSettings(prev => ({...prev, showDeletePrice: !prev.showDeletePrice}))}
                    >
                        <MdDelete />
                    </div>
                </div>
            </div>

            <EditPriceModal
                hidden={priceModalSettings.showEditPrice}
                toggleHidden={toggleShowEdit}
                productId={price.productId}
                price={price}
                setProduct={setProduct}
            />

            <DeletePriceModal
                hidden={priceModalSettings.showDeletePrice}
                toggleHidden={toggleShowDelete}
                price={price}
                setProduct={setProduct}
            />
        </>
    )
}

export default Price