import type { ProductBody } from '@/types/product'
import { Accordion, Box, Combobox, Input, InputBase, useCombobox } from '@mantine/core'
import { useState } from 'react'
import { ProductTitleBar } from './ProductTitleBar'
import { PriceBanner } from '@/components/price/PriceBanner'
import { ProductDetails } from './ProductDetails'
import { ProductRowControl } from './ProductRowControl'

export interface GroupedProduct {
    productBodies: ProductBody[]
    dateToday: Date
    setDateToday: (newVal: Date) => void
}

export const GroupedProduct = ({ productBodies, dateToday, setDateToday }: GroupedProduct) => {
    // Store picked by the user, if any // TODO: Show store with cheapest price
    const [chosenStore, setChosenStore] = useState<string | undefined>(undefined)
    // Use mantine combobox
    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption()
    })

    if (!productBodies || productBodies.length === 0) {
        return <></>
    }

    // Show the chosen store while it's still in the list, otherwise the first store
    const selectedStore = productBodies.some((productBody) => productBody.product.store === chosenStore)
        ? chosenStore
        : productBodies[0].product.store

    // The product at the selected store, whose actions the menu offers
    const selectedProduct = (
        productBodies.find((productBody) => productBody.product.store === selectedStore) ?? productBodies[0]
    ).product

    // Store options for the combobox
    const storeOptions = productBodies.map((productBody) => (
        <Combobox.Option
            value={productBody.product.store}
            key={productBody.product.store}
            className="flex items-center gap-2"
        >
            {productBody.product.store}
            <PriceBanner productBody={productBody} dateToday={dateToday} setDateToday={setDateToday} mini />
        </Combobox.Option>
    ))

    // Text for the other stores in the group, shown after the selected store
    const otherStoreCount = productBodies.length - 1
    const otherStoresText =
        otherStoreCount > 0 ? `(+${otherStoreCount} other ${otherStoreCount === 1 ? 'store' : 'stores'})` : undefined

    // ProductTitleBar for each product
    const productTitleBars = productBodies.map((productBody) => {
        if (productBody.product.store === selectedStore) {
            return (
                <ProductTitleBar
                    key={productBody.product.productId}
                    productBody={productBody}
                    dateToday={dateToday}
                    setDateToday={setDateToday}
                    otherStoresText={otherStoresText}
                />
            )
        }
    })

    // GroupedProductDescription for each product
    const productDescriptions = productBodies.map((productBody) => {
        if (productBody.product.store === selectedStore) {
            return (
                <ProductDetails
                    key={productBody.product.productId}
                    productBody={productBody}
                    dateToday={dateToday}
                    setDateToday={setDateToday}
                >
                    {/* Inset from the edges of the box it shares with the chart and price list */}
                    <div className="flex items-center w-auto gap-2 px-2 pt-2">
                        <Box className="w-full">
                            <Combobox
                                store={combobox}
                                onOptionSubmit={(store) => {
                                    setChosenStore(store)
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
                                        {selectedStore ? (
                                            selectedStore
                                        ) : (
                                            <Input.Placeholder>Select store</Input.Placeholder>
                                        )}
                                    </InputBase>
                                </Combobox.Target>

                                <Combobox.Dropdown mah={150} className="overflow-y-auto">
                                    <Combobox.Options>{storeOptions}</Combobox.Options>
                                </Combobox.Dropdown>
                            </Combobox>
                        </Box>
                    </div>
                </ProductDetails>
            )
        }
    })

    return (
        <div className="h-full w-full border-b border-smoke flex flex-col">
            <ProductRowControl product={selectedProduct}>
                {/* Top content */}
                {productTitleBars}
            </ProductRowControl>

            <Accordion.Panel>
                {/* Lower content */}
                {productDescriptions}
            </Accordion.Panel>
        </div>
    )
}
