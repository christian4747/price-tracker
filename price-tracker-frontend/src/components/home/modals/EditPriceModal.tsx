import type { PriceType, RecentPriceData } from "../../../utils/Types"
import { Button, Modal, TextInput, Tooltip } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { useEditPrice } from "@/hooks/price/useEditPrice"
import { MdEdit } from "react-icons/md"
import PriceNumberInput from "../price/PriceNumberInput"
import PriceCalculator from "../price/PriceCalculator"
import { getFormattedDateString } from "@/utils/DateUtilities"
import { RecentDataScroller } from "@/components/common/RecentDataScroller"
import { PriceDateTimePicker } from "../price/PriceDateTimePicker"

interface EditPriceModal {
    price: PriceType
    recentPriceData: RecentPriceData
}

export const EditPriceModal = ({ price, recentPriceData }: EditPriceModal) => {

    // Track state of modal open/close
    const [opened, { open, close }] = useDisclosure(false)

    // Hook for editing prices
    const { priceDTO, mutation } = useEditPrice(price)

    const recentDescriptions = recentPriceData?.descriptions.map((description: string, idx: number) => (
        <Button key={idx} onClick={() => priceDTO.setPriceDTO(prev => ({ ...prev, description: description }))}>
            {description}
        </Button>
    ))

    const recentCurrencies = recentPriceData?.currencies.map((currency: string, idx: number) => (
        <Button key={idx} onClick={() => priceDTO.setPriceDTO(prev => ({ ...prev, currency: currency }))}>
            {currency}
        </Button>
    ))

    const recentPricesStarted = recentPriceData?.pricesStarted.map((priceStarted: string, idx: number) => (
        <Button key={idx} onClick={() => priceDTO.setPriceDTO(prev => ({ ...prev, priceStarted: priceStarted }))}>
            {getFormattedDateString(priceStarted)}
        </Button>
    ))

    return (
        <>
            <Modal
                opened={opened}
                onClose={close}
                title="Edit Price"
            >
                <PriceCalculator />
                <PriceNumberInput
                    label="Price"
                    className="mb-2 min-w-75"
                    withAsterisk
                    value={priceDTO.value.amount}
                    onChange={(val) => {
                            if (val) {
                                priceDTO.setPriceDTO(prev => ({...prev, amount: val as number}))
                            } else {
                                priceDTO.setPriceDTO(prev => ({...prev, amount: 0.00}))
                                priceDTO.setPriceDTO(prev => ({...prev, returnAmount: 0.00}))
                            }
                        }
                    }
                />
                
                <PriceNumberInput
                    label="Return Amount"
                    className="mb-2"
                    value={priceDTO.value.returnAmount}
                    max={priceDTO.value.amount}
                    onChange={(val) => {
                            if (val && priceDTO.value.amount > 0) {
                                priceDTO.setPriceDTO(prev => ({...prev, returnAmount: val as number}))
                            } else {
                                priceDTO.setPriceDTO(prev => ({...prev, returnAmount: 0.00}))
                            }
                        }
                    }
                />

                <TextInput
                    label="Description"
                    radius='xl'
                    placeholder="Description"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {priceDTO.setPriceDTO(prev => ({...prev, description: e.target.value}))}}
                    value={priceDTO.value.description}
                    className="mb-2"
                />
                {recentDescriptions && <RecentDataScroller className='mb-2'>{recentDescriptions}</RecentDataScroller>}

                <TextInput
                    label="Currency"
                    radius='xl'
                    placeholder="ex. USD"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {priceDTO.setPriceDTO(prev => ({...prev, currency: e.target.value}))}}
                    value={priceDTO.value.currency}
                    className="mb-2"
                />
                {recentCurrencies && <RecentDataScroller className='mb-2'>{recentCurrencies}</RecentDataScroller>}

                <PriceDateTimePicker
                    label='Start Date'
                    withAsterisk
                    onChange={(val) => {val ? priceDTO.setPriceDTO(prev => ({...prev, priceStarted: val})) : priceDTO.setPriceDTO(prev => ({...prev, priceStarted: ''}))}}
                    value={priceDTO.value.priceStarted}
                    priceDate={priceDTO.value.priceStarted}
                />
                {recentPricesStarted && <RecentDataScroller className='mb-2'>{recentPricesStarted}</RecentDataScroller>}

                <Button fullWidth className="mt-5" onClick={(e) => {mutation.mutate();close();e.stopPropagation()}}>Edit Price</Button>
            </Modal>
            <div
                className="hidden group-hover/product:block cursor-pointer"
                onClick={(e) => {
                    open()
                    e.stopPropagation()
                }}
            >
                <Tooltip withArrow label="Edit Price"><MdEdit /></Tooltip>
            </div>
        </>
    )
}