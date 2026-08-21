import { type ProductType } from "@/utils/Types"
import PriceHistoryChart from "../price/PriceHistoryChart"
import PriceList from "../price/PriceList"
import { Accordion, Button, Center, CopyButton, Tooltip } from "@mantine/core"
import { FaLink, FaCheck, FaCopy } from "react-icons/fa6"
import DeleteProductModal from "../modals/DeleteProductModal"
import EditProductModal from "../modals/EditProductModal"
import { useState } from "react"

type ProductProps = {
    products: ProductType[]
    dateToday: Date
    setDateToday: (newVal: Date) => void
}

const GroupedProduct = ({products, dateToday, setDateToday}: ProductProps) => {

    if (!products || products.length === 0) {
        return <></>
    }

    const [selectedStore, setSelectedStore] = useState(products[0].store)

    return (
        <div className='h-full w-full border-t border-smoke flex flex-col gap-2 group'>
            <Accordion.Control>
                {/* Top content */}
                <div className='h-full min-h-11.25 w-full flex justify-between items-center pr-2'>
                    <div className='flex gap-3 items-baseline-last'>
                        <div title={products[0].name} className="text-lg max-w-100 truncate">
                            {products[0].name}
                        </div>
                        <div className="text-raincloud">
                            {products[0].store}
                        </div>
                        <a className="cursor-pointer" href={products[0].link} target="_blank">
                            <Tooltip withArrow label={products[0].link}><FaLink /></Tooltip>
                        </a>
                        <EditProductModal product={products[0]}/>
                        <DeleteProductModal product={products[0]}/>
                        <CopyButton value={products[0].name} timeout={1000}>
                            {({copied, copy}) => (
                                <div
                                    className="hidden group-hover:block cursor-pointer"
                                    onClick={(e) => {
                                        copy()
                                        e.stopPropagation()
                                    }}
                                >
                                    <Tooltip
                                        label={copied ? 'Copied!' : 'Copy Product Name'}
                                        withArrow
                                    >
                                        {copied ? <FaCheck /> :<FaCopy />}
                                    </Tooltip>
                                </div>
                            )}
                        </CopyButton>
                    </div>
                    
            </div>
            </Accordion.Control>

            <Accordion.Panel>
                {/* Lower content */}
                <div className='w-full h-full flex justify-between gap-2'>
                    <PriceHistoryChart
                        product={products[0]}
                        dateToday={dateToday}
                    />
                    <div className="flex flex-col w-3/10 h-auto gap-2">
                        <div>
                            <Center>
                                <Button.Group>
                                    {products?.map((product) => {
                                        return (
                                            <Button
                                                variant={product.store !== selectedStore ? "default" : "filled"}
                                                onClick={() => {setSelectedStore(product.store)}}
                                            >
                                                {product.store}
                                            </Button>
                                        )
                                    })}
                                </Button.Group>
                            </Center>
                        </div>
                        {products?.map((product) => {
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
                        })}
                    </div>
                </div>
            </Accordion.Panel>
        </div>
    )
}

export default GroupedProduct