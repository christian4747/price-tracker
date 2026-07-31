import Button from '../../common/Button'
import { FiPlus } from 'react-icons/fi'
import { MdRefresh } from 'react-icons/md'

type Props = {
    toggleAddProduct: () => void
    getAllProducts: () => void
}

const ProductListHeader = ({toggleAddProduct, getAllProducts}: Props) => {
    return (
        <div className="flex items-baseline gap-2 justify-between">
            <div className="flex items-center gap-2 mb-3">
                <div className="text-5xl font-bold font-mono">
                    Products
                </div>
                <Button
                    onClick={toggleAddProduct}
                >
                    <FiPlus size={24} />
                </Button>
            </div>
            <div className="pr-2 cursor-pointer" onClick={getAllProducts}>
                <MdRefresh size={36} />
            </div>
            {/* <div className="pr-2">
                <FaFilter size={24} />
            </div> */}
        </div>
    )
}

export default ProductListHeader