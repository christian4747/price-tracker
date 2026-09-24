import { MdSearch } from 'react-icons/md'
import { useEffect, useState } from 'react'
import { Button, Input, Menu } from '@mantine/core'
import AddProductModal from '../modals/AddProductModal'
import type { ProductFilterDTO } from '@/utils/Types'
import { ACTIVE_INACTIVE_PRODUCTS, ACTIVE_PRODUCTS, INACTIVE_PRODUCTS } from '@/utils/FilterConstants'
import { useDebouncedState } from '@mantine/hooks'

interface ProductListHeader {
    searchSearchTerm: (searchTerm: string) => void
    productsGroupBy: string
    setProductsGroupBy: React.Dispatch<React.SetStateAction<string>>
    productFilterDTO: ProductFilterDTO
    setField: (key: string, value: string | boolean) => void
}

export const ProductListHeader = ({ searchSearchTerm, productsGroupBy, setProductsGroupBy, productFilterDTO, setField }: ProductListHeader) => {

    // Debounce the search term when entering text
    const [currentSearchTerm, setCurrentSearchTerm] = useDebouncedState('', 500)
    // Track the search term locally
    const [localSearchTerm, setLocalSearchTerm] = useState('')

    const setSearchTerm = (e: React.ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
        setCurrentSearchTerm(e.target.value)
        setLocalSearchTerm(e.target.value)
    }

    const clearSearchTerm = () => {
        setCurrentSearchTerm('')
        setLocalSearchTerm('')
    }

    useEffect(() => {
        searchSearchTerm(currentSearchTerm)
    }, [currentSearchTerm])

    return (
        <>
            <div className="sticky top-0 pt-5 z-50 bg-white flex flex-col gap-2">
                <div className="text-5xl">
                    My Products
                </div>
                <div className='border-t border-b pb-0 pt-3 border-smoke'>
                    <div className="flex items-center gap-2 justify-between mb-3">

                        <div className='flex gap-2'>
                            <Menu>
                                <Menu.Target>
                                    <Button className='flex gap-2 min-w-30'>
                                        {productFilterDTO.active}
                                    </Button>
                                </Menu.Target>

                                <Menu.Dropdown>
                                    <Menu.Label>Status</Menu.Label>
                                    <Menu.RadioGroup value={productFilterDTO.active} onChange={(val) => setField('active', val)}>
                                        <Menu.RadioItem value={ACTIVE_INACTIVE_PRODUCTS}>All</Menu.RadioItem>
                                        <Menu.RadioItem value={ACTIVE_PRODUCTS}>Active</Menu.RadioItem>
                                        <Menu.RadioItem value={INACTIVE_PRODUCTS}>Inactive</Menu.RadioItem>
                                    </Menu.RadioGroup>
                                </Menu.Dropdown>
                            </Menu>

                            <Menu>
                                <Menu.Target>
                                    <Button className='flex gap-2 min-w-30'>
                                        {productsGroupBy.length > 0 ? `Group By: ${productsGroupBy}` : 'Group By'}
                                    </Button>
                                </Menu.Target>

                                <Menu.Dropdown>
                                    <Menu.Label>Group By</Menu.Label>
                                    <Menu.RadioGroup value={productsGroupBy} onChange={setProductsGroupBy}>
                                        <Menu.RadioItem value=''>None</Menu.RadioItem>
                                        <Menu.RadioItem value='Name'>Name</Menu.RadioItem>
                                    </Menu.RadioGroup>
                                </Menu.Dropdown>
                            </Menu>

                            <Menu>
                                <Menu.Target>
                                    <Button className='flex gap-2 min-w-30'>
                                        {productFilterDTO.deleted === 'true' ? 'Show Deleted' : 'Hide Deleted'}
                                    </Button>
                                </Menu.Target>

                                <Menu.Dropdown>
                                    <Menu.Label>Deleted Product Visibility</Menu.Label>
                                    <Menu.RadioGroup
                                        value={productFilterDTO.deleted}
                                        onChange={(val) => setField('deleted', val)}
                                    >
                                        <Menu.RadioItem value='false'>Hide</Menu.RadioItem>
                                        <Menu.RadioItem value='true'>Show</Menu.RadioItem>
                                    </Menu.RadioGroup>
                                </Menu.Dropdown>
                            </Menu>
                        </div>

                        <div className='flex items-center gap-2'>
                            <div className='flex max-w-50'>
                                <Input
                                    radius='xl'
                                    className='border-none focus-visible:border-none focus-within:outline-none min-h-8'
                                    onChange={setSearchTerm}
                                    value={localSearchTerm}
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
                                                onClick={clearSearchTerm}
                                            />
                                        ) : null
                                    }
                                />
                            </div>

                            <div>
                                <AddProductModal />
                            </div>

                        </div>
                        {/* <div className="pr-2">
                            <FaFilter size={24} />
                        </div> */}
                    </div>
                </div>
            </div>
        </>
    )
}