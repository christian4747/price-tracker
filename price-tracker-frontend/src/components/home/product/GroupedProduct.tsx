import { type ProductType } from "@/utils/Types"
import PriceHistoryChart from "../price/PriceHistoryChart"
import { PriceList } from "../price/PriceList"
import { Accordion, Box, Combobox, Input, InputBase, Tooltip, useCombobox } from "@mantine/core"
import { FaLink } from "react-icons/fa6"
import { useContext, useEffect, useState } from "react"
import { ProductTitleBar } from "./ProductTitleBar"
import { PriceBanner } from "../price/PriceBanner"
import { MdEdit, MdDelete } from "react-icons/md"
import { DeleteProductContext, EditProductContext } from "@/context/ProductContext"

export interface GroupedProduct {
    products: ProductType[]
    dateToday: Date
    setDateToday: (newVal: Date) => void
}

export const GroupedProduct = ({ products, dateToday, setDateToday }: GroupedProduct) => {

    // Track state of selected store // TODO: Show store with cheapest price
    const [selectedStore, setSelectedStore] = useState<string>(products[0].store)
    // Use mantine combobox
    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption()
    })
    
    const openEditProductModal = useContext(EditProductContext)
    const openDeleteProductModal = useContext(DeleteProductContext)

    // Reset to first product when list changes
    useEffect(() => {
        setSelectedStore(products[0].store)
    }, [products])

    if (!products || products.length === 0) {
        return <></>
    }

    // Store options for the combobox
    const storeOptions = products.map((product) => (
        <Combobox.Option value={product.store} key={product.store} className="flex items-center gap-2">
            {product.store}
            <PriceBanner
                product={product}
                dateToday={dateToday}
                setDateToday={setDateToday}
                mini
            />
        </Combobox.Option>
    ))

    // ProductTitleBar for each product
    const productTitleBars = products.map((product) => {
        if (product.store === selectedStore) {
            return (
                <ProductTitleBar
                    product={product}
                    dateToday={dateToday}
                    setDateToday={setDateToday}
                    storeString={
                        selectedStore + (
                            products.length - 1 === 1 ?
                                products.length - 1 === 1 ?
                                    ` (+${products.length - 1} other store)`
                                    :
                                    ` (+${products.length - 1} other stores)`
                                :
                                ''
                        )
                    }
                />
            )
        }
    })

    // PriceHistoryChart for each product
    const productPriceHistoryCharts = products.map((product) => {
        if (product.store === selectedStore) {
            return (
                <PriceHistoryChart
                    product={product}
                    dateToday={dateToday}
                />
            )
        }
    })

    // Product action bar (link, edit, delete) for each product
    const productActionBars = products.map((product) => {
        if (product.store === selectedStore) {
            return (
                <>
                    <a className="cursor-pointer" href={product.link} target="_blank">
                        <Tooltip withArrow label={product.link}><FaLink /></Tooltip>
                    </a>
                    <div
                        className='cursor-pointer'
                        onClick={(e) => {
                            openEditProductModal(product)
                            e.stopPropagation()
                        }}
                    >
                        <Tooltip withArrow label="Edit Product"><MdEdit /></Tooltip>
                    </div>
        
                    <div
                        className='cursor-pointer'
                        onClick={(e) => {
                            openDeleteProductModal(product)
                            e.stopPropagation()
                        }}
                    >
                        <Tooltip withArrow label="Delete Product"><MdDelete /></Tooltip>
                    </div>
                </>
            )
        }
    })

    // Product price list for each product
    const productPriceLists = products?.map((product) => {
        if (product.store === selectedStore) {
            return (
                <PriceList
                    product={product}
                    setDateToday={setDateToday}
                />
            )
        }
    })

    return (
        <div className='h-full w-full border-b border-smoke flex flex-col gap-2 group'>
            <Accordion.Control>
                {/* Top content */}
                {productTitleBars}
            </Accordion.Control>

            <Accordion.Panel>
                {/* Lower content */}
                <div className='w-full h-full flex justify-between gap-2'>
                    {productPriceHistoryCharts}

                    <div className="flex flex-col w-3/10 gap-2">
                        <div className="flex items-center w-auto gap-2">
                            <Box className="w-full">
                                <Combobox
                                    store={combobox}
                                    onOptionSubmit={(store) => {
                                        setSelectedStore(store)
                                        combobox.closeDropdown()
                                    }}
                                >
                                    <Combobox.Target>
                                        <InputBase
                                            component="button"
                                            type="button"
                                            pointer
                                            rightSection={<Combobox.Chevron />}
                                            rightSectionPointerEvents="none"
                                            onClick={() => combobox.toggleDropdown()}
                                        >
                                            {selectedStore ? selectedStore : <Input.Placeholder>Select store</Input.Placeholder>}
                                        </InputBase>
                                    </Combobox.Target>

                                    <Combobox.Dropdown mah={150} className="overflow-y-auto" >
                                        <Combobox.Options>{storeOptions}</Combobox.Options>
                                    </Combobox.Dropdown>
                                </Combobox>
                            </Box>
                            {productActionBars}
                        </div>
                        {productPriceLists}
                    </div>
                </div>
            </Accordion.Panel>
        </div>
    )
}