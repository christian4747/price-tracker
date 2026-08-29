
import { Button, Center, Collapse, Modal, Switch, TextInput } from '@mantine/core'
import type { ProductType, RecentPriceData } from '@/utils/Types'
import { useDisclosure } from '@mantine/hooks'
import { useAddPrice } from '@/hooks/price/useAddPrice'
import { getFormattedDateString, getLocalDateFromUTC } from '@/utils/DateUtilities'
import { getHighestPrice } from '@/utils/PriceUtilities'
import { DateTimePicker } from '@mantine/dates'
import { FiCalendar } from 'react-icons/fi'
import { useState } from 'react'
import PriceCalculator from '../price/PriceCalculator'
import PriceNumberInput from '../price/PriceNumberInput'
import dayjs from 'dayjs'
import { RecentDataScroller } from '@/components/common/RecentDataScroller'

interface AddPriceModal {
    product: ProductType
    setDateToday: (newVal: Date) => void
    recentPriceData: RecentPriceData
}

export const AddPriceModal = ({ product, setDateToday, recentPriceData }: AddPriceModal) => {

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

    const recentPricesEnded = recentPriceData?.pricesEnded.map((priceEnded: string, idx: number) => (
        <Button key={idx} onClick={() => priceDTO.setPriceDTO(prev => ({ ...prev, priceEnded: priceEnded }))}>
            {getFormattedDateString(priceEnded)}
        </Button>
    ))


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
                {recentPricesStarted && <RecentDataScroller className='mb-2'>{recentPricesStarted}</RecentDataScroller>}

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
                    {recentPricesEnded && <RecentDataScroller className='mb-2'>{recentPricesEnded}</RecentDataScroller>}

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