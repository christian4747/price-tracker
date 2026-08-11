import { MdSearch, MdSort } from 'react-icons/md'
import { useState } from 'react'
import { Button, Input, Menu } from '@mantine/core'
import AddProductModal from '../modals/AddProductModal'

type Props = {
    getAllProducts: () => void
    searchSearchTerm: (searchTerm: string) => void
    productStatusFilter: string
    setProductStatusFilter: React.Dispatch<React.SetStateAction<string>>
}

const ProductListHeader = ({searchSearchTerm, productStatusFilter, setProductStatusFilter}: Props) => {

    // State for tracking current input value
    const [currentSearchTerm, setCurrentSearchTerm] = useState('')

    return (
        <>
            <div className="flex items-center gap-2 justify-between mb-3">

                <div className='flex gap-2'>
                    <Menu>
                        <Menu.Target>
                            <Button className='flex gap-2 min-w-27.5'>
                                {productStatusFilter}
                            </Button>
                        </Menu.Target>

                        <Menu.Dropdown>
                            <Menu.Label>Status</Menu.Label>
                            <Menu.RadioGroup value={productStatusFilter} onChange={setProductStatusFilter}>
                                <Menu.RadioItem value="All">All</Menu.RadioItem>
                                <Menu.RadioItem value="Active">Active</Menu.RadioItem>
                                <Menu.RadioItem value="Inactive">Inactive</Menu.RadioItem>
                            </Menu.RadioGroup>
                        </Menu.Dropdown>
                    </Menu>

                    <Button className='flex gap-2'>
                        <MdSort/>Sort
                    </Button>
                </div>

                <div className='flex items-center gap-2'>
                    <div className='flex max-w-50'>
                        <Input
                            radius='xl'
                            className='border-none focus-visible:border-none focus-within:outline-none min-h-8'
                            onChange={(e) => setCurrentSearchTerm(e.target.value)}
                            value={currentSearchTerm}
                            placeholder='Search'
                            leftSectionPointerEvents="all"
                            leftSection={
                                <div className='cursor-pointer pl-2' onClick={() => searchSearchTerm(currentSearchTerm)}>
                                    <MdSearch size={24} />
                                </div>
                            }
                            rightSectionPointerEvents="all"
                            rightSection={
                                currentSearchTerm ? (
                                    <Input.ClearButton
                                    aria-label="Clear input"
                                    onClick={() => {
                                        setCurrentSearchTerm('')
                                        searchSearchTerm('')
                                    }}
                                    />
                                ) : null
                            }
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    setCurrentSearchTerm(currentSearchTerm)
                                    searchSearchTerm(currentSearchTerm)
                                }
                            }}
                        />
                    </div>

                    <div>
                        <AddProductModal />
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