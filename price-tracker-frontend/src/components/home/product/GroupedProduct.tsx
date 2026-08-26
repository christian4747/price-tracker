import { type ProductType } from "@/utils/Types"
import PriceHistoryChart from "../price/PriceHistoryChart"
import PriceList from "../price/PriceList"
import { Accordion, Box, Combobox, Input, InputBase, Skeleton, Tooltip, useCombobox } from "@mantine/core"
import { FaLink } from "react-icons/fa6"
import DeleteProductModal from "../modals/DeleteProductModal"
import EditProductModal from "../modals/EditProductModal"
import { useState } from "react"
import PriceBannerBadge from "../price/PriceBannerBadge"
import { ProductTitleBar } from "./ProductTitleBar"

export interface GroupedProduct {
    products: ProductType[]
    dateToday: Date
    setDateToday: (newVal: Date) => void
}

// TODO: Optimize repeating code
export const GroupedProduct = ({ products, dateToday, setDateToday }: GroupedProduct) => {

    if (!products || products.length === 0) {
        return <></>
    }

    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption()
    })

    const [selectedStore, setSelectedStore] = useState<string | undefined>(products[0].store)

    const storeOptions = products.map((product) => (
        <Combobox.Option value={product.store} key={product.store} className="flex items-center gap-2">
            {product.store}
            <PriceBannerBadge
                product={product}
                dateToday={dateToday}
                setDateToday={setDateToday}
            />
        </Combobox.Option>
    ))

    const onProductDeleteEdit = (prevStore: string) => {
        if (selectedStore === prevStore) {
            setSelectedStore(products[0].store)
        }
    }

    return (
        <div className='h-full w-full border-b border-smoke flex flex-col gap-2 group'>
            <Accordion.Control>
                {/* Top content */}

                {products?.map((product) => {
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
                })}
            </Accordion.Control>

            <Accordion.Panel>
                {/* Lower content */}
                <div className='w-full h-full flex justify-between gap-2'>
                    {selectedStore ? 
                        products?.map((product) => {
                            return (
                                <>
                                    {product.store === selectedStore &&
                                        <PriceHistoryChart
                                            product={product}
                                            dateToday={dateToday}
                                        />
                                    }
                                </>
                            )
                        })
                        :
                        <Skeleton style={{aspectRatio: 3 / 1}} height="100%" width="70%" animate={false} />
                    }
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

                            {products?.map((product) => {
                                return (
                                    <>
                                        {product.store === selectedStore &&
                                            <>
                                                <a className="cursor-pointer" href={product.link} target="_blank">
                                                    <Tooltip withArrow label={product.link}><FaLink /></Tooltip>
                                                </a>
                                                <EditProductModal product={product} showOnHover={false} onEdit={() => onProductDeleteEdit(product.store)}/>
                                                <DeleteProductModal product={product} showOnHover={false} onDelete={() => onProductDeleteEdit(product.store)}/>
                                            </>
                                        }
                                    </>
                                )
                            })}

                        </div>
                        {selectedStore ?
                            products?.map((product) => {
                                return (
                                    <>
                                        {selectedStore === product.store &&
                                            <PriceList
                                                product={product}
                                                setDateToday={setDateToday}
                                            />
                                        }
                                    </>
                                )
                            })
                            :
                            <Skeleton height='100%' className='w-full' animate={false} />
                        }
                    </div>
                </div>
            </Accordion.Panel>
        </div>
    )
}