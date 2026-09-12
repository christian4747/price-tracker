import { type ProductBody } from "@/utils/Types"
import { Accordion, Box, Combobox, Input, InputBase, Tooltip, useCombobox } from "@mantine/core"
import { FaLink } from "react-icons/fa6"
import { useContext, useEffect, useState } from "react"
import { ProductTitleBar } from "./ProductTitleBar"
import { PriceBanner } from "../price/PriceBanner"
import { MdEdit, MdDelete } from "react-icons/md"
import { DeleteProductContext, EditProductContext } from "@/context/ProductContext"
import { GroupedProductDescription } from "./GroupedProductDescription"

export interface GroupedProduct {
    productBodies: ProductBody[]
    dateToday: Date
    setDateToday: (newVal: Date) => void
}

export const GroupedProduct = ({ productBodies, dateToday, setDateToday }: GroupedProduct) => {

    // Track state of selected store // TODO: Show store with cheapest price
    const [selectedStore, setSelectedStore] = useState<string>(productBodies[0].product.store)
    // Use mantine combobox
    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption()
    })
    
    const openEditProductModal = useContext(EditProductContext)
    const openDeleteProductModal = useContext(DeleteProductContext)

    // Reset to first product when list changes
    useEffect(() => {
        setSelectedStore(productBodies[0].product.store)
    }, [productBodies])

    if (!productBodies || productBodies.length === 0) {
        return <></>
    }

    // Store options for the combobox
    const storeOptions = productBodies.map((productBody) => (
        <Combobox.Option value={productBody.product.store} key={productBody.product.store} className="flex items-center gap-2">
            {productBody.product.store}
            <PriceBanner
                productBody={productBody}
                dateToday={dateToday}
                setDateToday={setDateToday}
                mini
            />
        </Combobox.Option>
    ))

    // ProductTitleBar for each product
    const productTitleBars = productBodies.map((productBody) => {
        if (productBody.product.store === selectedStore) {
            return (
                <ProductTitleBar
                    productBody={productBody}
                    dateToday={dateToday}
                    setDateToday={setDateToday}
                    storeString={
                        selectedStore + (
                            productBodies.length - 1 === 1 ?
                                productBodies.length - 1 === 1 ?
                                    ` (+${productBodies.length - 1} other store)`
                                    :
                                    ` (+${productBodies.length - 1} other stores)`
                                :
                                ''
                        )
                    }
                />
            )
        }
    })

    // Product action bar (link, edit, delete) for each product
    const productActionBars = productBodies.map((productBody) => {
        if (productBody.product.store === selectedStore) {
            return (
                <>
                    <a className="cursor-pointer" href={productBody.product.link} target="_blank">
                        <Tooltip withArrow label={productBody.product.link}><FaLink /></Tooltip>
                    </a>
                    <div
                        className='cursor-pointer'
                        onClick={(e) => {
                            openEditProductModal(productBody.product)
                            e.stopPropagation()
                        }}
                    >
                        <Tooltip withArrow label="Edit Product"><MdEdit /></Tooltip>
                    </div>

                    <div
                        className='cursor-pointer'
                        onClick={(e) => {
                            openDeleteProductModal(productBody.product)
                            e.stopPropagation()
                        }}
                    >
                        <Tooltip withArrow label="Delete Product"><MdDelete /></Tooltip>
                    </div>
                </>
            )
        }
    })

    // GroupedProductDescription for each product
    const productDescriptions = productBodies.map((productBody) => {
        if (productBody.product.store === selectedStore) {
            return (
                <GroupedProductDescription
                    productBody={productBody}
                    dateToday={dateToday}
                    setDateToday={setDateToday}
                >
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
                </GroupedProductDescription>
            )
        }
    })

    return (
        <div className='h-full w-full border-b border-smoke flex flex-col group'>
            <Accordion.Control>
                {/* Top content */}
                {productTitleBars}
            </Accordion.Control>

            <Accordion.Panel>
                {/* Lower content */}
                {productDescriptions}
            </Accordion.Panel>
        </div>
    )
}