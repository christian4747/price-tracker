import Button from '../../common/Button'
import { MdClear, MdExpandMore, MdRefresh, MdSearch, MdSort } from 'react-icons/md'
import Input from '../../common/Input'
import type { Dispatch, SetStateAction } from 'react'

type Props = {
    toggleAddProduct: () => void
    getAllProducts: () => void
    currentSearchTerm: string
    setCurrentSearchTerm: Dispatch<SetStateAction<string>>
    searchSearchTerm: (searchTerm: string) => void
}

const ProductListHeader = ({toggleAddProduct, getAllProducts, currentSearchTerm, setCurrentSearchTerm, searchSearchTerm}: Props) => {
    return (
        <>
            <div className="flex items-center gap-2 justify-between mb-3">

                <div className='flex gap-2'>
                    <Button className='flex gap-2'>
                        Active<MdExpandMore/>
                    </Button>

                    <Button className='flex gap-2'>
                        <MdSort/>Sort
                    </Button>
                </div>

                <div className='flex items-center gap-2'>

                    <div className='flex border border-smoke rounded-sm max-w-50'>
                        <Input
                            className='border-none focus-visible:border-none focus-within:outline-none min-h-8'
                            onChange={(e) => setCurrentSearchTerm(e.target.value)}
                            value={currentSearchTerm}
                            placeholder='Search'
                        />
                        <div className='flex items-center gap-1'>
                            {/* Clear input */}
                            {currentSearchTerm.length >= 1 &&
                                <div
                                    className='cursor-pointer'
                                    onClick={() => {
                                        setCurrentSearchTerm('')
                                        searchSearchTerm('')
                                    }}
                                >
                                    <MdClear size={24} />
                                </div>
                            }
                            {/* Search button */}
                            <div className='cursor-pointer pr-1' onClick={() => searchSearchTerm(currentSearchTerm)}>
                                <MdSearch size={24} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <Button
                        onClick={toggleAddProduct}
                        >
                            Add Product
                        </Button>
                    </div>

                    {/* <div className="pr-2 cursor-pointer" onClick={getAllProducts}>
                        <MdRefresh size={48} />
                    </div> */}
                </div>
                {/* <div className="pr-2">
                    <FaFilter size={24} />
                </div> */}
            </div>
        </>
    )
}

export default ProductListHeader