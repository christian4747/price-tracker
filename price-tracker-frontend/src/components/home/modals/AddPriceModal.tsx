
import { Button, Center, Collapse, Group, Modal, Scroller, Switch, TextInput } from '@mantine/core'
import type { ProductType } from '@/utils/Types'
import { useDisclosure } from '@mantine/hooks'
import { useAddPrice } from '@/hooks/price/useAddPrice'
import { getFormattedDateString, getLocalDateFromUTC } from '@/utils/DateUtilities'
import { getHighestPrice } from '@/utils/PriceUtilities'
import { DateTimePicker } from '@mantine/dates'
import { FiCalendar } from 'react-icons/fi'
import { useState } from 'react'
import PriceCalculator from '../price/PriceCalculator'
import PriceNumberInput from '../price/PriceNumberInput'
import { useRecentPriceDates } from '@/hooks/price/recent/useRecentPriceDates'
import { useRecentPriceCurrencies } from '@/hooks/price/recent/useRecentPriceCurrencies'
import { useRecentPriceDescriptions } from '@/hooks/price/recent/useRecentPriceDescriptions'
import dayjs from 'dayjs'

type AddPriceModalProps = {
    product: ProductType
    setDateToday: (newVal: Date) => void
}

const AddPriceModal = ({ product, setDateToday }: AddPriceModalProps) => {

    // Track state of modal open/close
    const [opened, { open, close }] = useDisclosure(false)
    // Track state of expanding the end date input
    const [expandEndDate, { open: openEndDate, close: closeEndDate }] = useDisclosure(false)
    // Track button group state for selecting start date or start + end date
    const [useEndDate, setUseEndDate] = useState(false)
    // Track state for adding desc to end date
    const [useEndDateDesc, setUseEndDateDesc] = useState(false)

    // Hook for adding prices
    const { priceDTO, mutation: multiMutation, singleMutation } = useAddPrice(product, getHighestPrice(product?.prices), useEndDateDesc)
    // Hook for recent price currencies
    const { query: recentCurrenciesQuery } = useRecentPriceCurrencies()
    // Hook for recent price dates
    const { query: recentPriceAddedQuery } = useRecentPriceDates()
    // Hook for recent price descriptions
    const { query: recentDescriptionQuery } = useRecentPriceDescriptions()


    // Automatically set price started with current time when opening
    const openAddPriceModal = () => {
        priceDTO.setPriceDTO(prev => ({...prev, priceStarted: getLocalDateFromUTC(new Date()).format()}))
        open()
    }

    return (
        <>
            <Modal
                opened={opened}
                onClose={close}
                title="Add Price"
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
                <Scroller className='mb-2'>
                    <Group gap="xs" wrap="nowrap">
                        {recentDescriptionQuery.isSuccess && recentDescriptionQuery.data
                            .map((description: string, idx: number) => {
                                return (
                                    <Button key={idx} onClick={() => priceDTO.setPriceDTO(prev => ({ ...prev, description: description }))}>
                                        {description}
                                    </Button>
                                )
                            })
                        }
                    </Group>
                </Scroller>

                <TextInput
                    label="Currency"
                    radius='xl'
                    placeholder="ex. USD"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {priceDTO.setPriceDTO(prev => ({...prev, currency: e.target.value}))}}
                    value={priceDTO.value.currency}
                    className="mb-2"
                />
                <Scroller className='mb-2'>
                    <Group gap="xs" wrap="nowrap">
                        {recentCurrenciesQuery.isSuccess && recentCurrenciesQuery.data
                            .map((currency: string, idx: number) => {
                                return (
                                    <Button key={idx} onClick={() => priceDTO.setPriceDTO(prev => ({ ...prev, currency: currency }))}>
                                        {currency}
                                    </Button>
                                )
                            })
                        }
                    </Group>
                </Scroller>

                <Center>
                    <Button.Group>
                        <Button
                            variant={useEndDate ? "default" : "filled"}
                            onClick={() => {setUseEndDate(false);closeEndDate()}}
                        >
                            Start Date Only
                        </Button>
                        <Button
                            variant={useEndDate ? "filled" : "default"}
                            onClick={() => {setUseEndDate(true);openEndDate()}}
                        >
                            Start and End Date
                        </Button>
                    </Button.Group>
                </Center>

                <DateTimePicker
                    label="Start Date"
                    withAsterisk
                    radius='xl'
                    onChange={(val) => {val ? priceDTO.setPriceDTO(prev => ({...prev, priceStarted: val})) : priceDTO.setPriceDTO(prev => ({...prev, priceStarted: ''}))}}
                    value={priceDTO.value.priceStarted}
                    rightSectionPointerEvents="none"
                    rightSection={
                        <div className='pr-2'>
                            <FiCalendar size={24} />
                        </div>
                    }
                    valueFormat="MMM DD, YYYY H:mm A"
                    presets={[
                        { value: dayjs(priceDTO.value.priceStarted).startOf('day').format("MMM DD, YYYY H:mm A"), label: '00:00' },
                        { value: dayjs(priceDTO.value.priceStarted).endOf('day').second(0).toDate().toString(), label: '23:59' }
                    ]}
                    className="mb-2"
                />
                <Scroller>
                    <Group gap="xs" wrap="nowrap">
                        {recentPriceAddedQuery.isSuccess && recentPriceAddedQuery.data
                            .map((priceStarted: string, idx: number) => {
                                return (
                                    <Button key={idx} onClick={() => priceDTO.setPriceDTO(prev => ({ ...prev, priceStarted: priceStarted }))}>
                                        {getFormattedDateString(priceStarted)}
                                    </Button>
                                )
                            })
                        }
                    </Group>
                </Scroller>

                <Collapse expanded={expandEndDate}>
                    <DateTimePicker
                        label="End Date"
                        placeholder="Date price ends"
                        radius='xl'
                        onChange={(val) => {val ? priceDTO.setPriceDTO(prev => ({...prev, priceEnded: val})) : priceDTO.setPriceDTO(prev => ({...prev, priceEnded: ''}))}}
                        value={priceDTO.value.priceEnded}
                        rightSectionPointerEvents="none"
                        rightSection={
                            <div className='pr-2'>
                                <FiCalendar size={24} />
                            </div>
                        }
                        valueFormat="MMM DD, YYYY hh:mm A"
                        className="mb-2"
                    />
                    <Scroller className='mb-2'>
                        <Group gap="xs" wrap="nowrap">
                            {recentPriceAddedQuery.isSuccess && recentPriceAddedQuery.data
                                .map((priceStarted: string, idx: number) => {
                                    return (
                                        <Button key={idx} onClick={() => priceDTO.setPriceDTO(prev => ({ ...prev, priceEnded: priceStarted }))}>
                                            {getFormattedDateString(priceStarted)}
                                        </Button>
                                    )
                                })
                            }
                        </Group>
                    </Scroller>

                    <Switch
                        label='Use same description for end date'
                        checked={useEndDateDesc}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setUseEndDateDesc(e.target.checked)}}
                    />
                </Collapse>

                <Button
                    className="mt-5"
                    fullWidth
                    onClick={
                        () => {
                            useEndDate || priceDTO.value.priceEnded?.length === 0 ? multiMutation.mutate() : singleMutation.mutate()
                            close()
                            setDateToday(new Date())
                        }
                    }
                >
                    Add Price
                </Button>
            </Modal>
            <Button className="m-2" onClick={openAddPriceModal}>Add Price</Button>
        </>
    )
}

export default AddPriceModal