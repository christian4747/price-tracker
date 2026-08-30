
import { Button, Center, Collapse, Modal, Switch, TextInput } from '@mantine/core'
import type { ProductType } from '@/utils/Types'
import { useDisclosure } from '@mantine/hooks'
import { useAddPrice } from '@/hooks/price/useAddPrice'
import { getFormattedDateString, getLocalDateFromUTC } from '@/utils/DateUtilities'
import { getHighestPrice } from '@/utils/PriceUtilities'
import { useState } from 'react'
import PriceCalculator from '../price/PriceCalculator'
import PriceNumberInput from '../price/PriceNumberInput'
import { RecentDataScroller } from '@/components/common/RecentDataScroller'
import { PriceDateTimePicker } from '../price/PriceDateTimePicker'
import { useRecentPriceData } from '@/hooks/price/useRecentPriceData'

interface AddPriceModal {
    product: ProductType
    setDateToday: (newVal: Date) => void
}

export const AddPriceModal = ({ product, setDateToday }: AddPriceModal) => {

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
    // Hook for recent price data
    const { query: recentPriceQuery } = useRecentPriceData()


    const recentDescriptions = recentPriceQuery.data?.descriptions.map((description: string, idx: number) => (
        <Button key={idx} onClick={() => priceDTO.setField('description', description)}>
            {description}
        </Button>
    ))
    
    const recentCurrencies = recentPriceQuery.data?.currencies.map((currency: string, idx: number) => (
        <Button key={idx} onClick={() => priceDTO.setField('currency', currency)}>
            {currency}
        </Button>
    ))

    const recentPricesStarted = recentPriceQuery.data?.pricesStarted.map((priceStarted: string, idx: number) => (
        <Button key={idx} onClick={() => priceDTO.setField('priceStarted', priceStarted)}>
            {getFormattedDateString(priceStarted)}
        </Button>
    ))

    const recentPricesEnded = recentPriceQuery.data?.pricesEnded.map((priceEnded: string, idx: number) => (
        <Button key={idx} onClick={() => priceDTO.setField('priceEnded', priceEnded)}>
            {getFormattedDateString(priceEnded)}
        </Button>
    ))


    // Automatically set price started with current time when opening
    const openAddPriceModal = () => {
        priceDTO.setField('priceStarted', getLocalDateFromUTC(new Date()).format())
        open()
    }

    const setAmount = (amount: number) => {
        if (!amount) {
            priceDTO.setField('amount', 0)
            priceDTO.setField('returnAmount', 0)
        } else {
            priceDTO.setField('amount', amount)
            priceDTO.setField('returnAmount', Math.min(amount, priceDTO.value.returnAmount))
        }
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
                    onChange={(amount) => setAmount(amount as number)}
                />
                
                <PriceNumberInput
                    label="Return Amount"
                    className="mb-2"
                    value={priceDTO.value.returnAmount}
                    max={priceDTO.value.amount}
                    onChange={(returnAmount) => priceDTO.setField('returnAmount', returnAmount)}
                />

                <TextInput
                    label="Description"
                    radius='xl'
                    placeholder="Description"
                    onChange={(e) => priceDTO.setField('description', e.target.value)}
                    value={priceDTO.value.description}
                    className="mb-2"
                />
                {recentDescriptions && <RecentDataScroller className='mb-2'>{recentDescriptions}</RecentDataScroller>}

                <TextInput
                    label="Currency"
                    radius='xl'
                    placeholder="ex. USD"
                    onChange={(e) => priceDTO.setField('currency', e.target.value)}
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

                <PriceDateTimePicker
                    label='Start Date'
                    withAsterisk
                    onChange={(priceStarted) => priceStarted ? priceDTO.setField('priceStarted', priceStarted) : ''}
                    value={priceDTO.value.priceStarted}
                    priceDate={priceDTO.value.priceStarted}
                />
                {recentPricesStarted && <RecentDataScroller className='mb-2'>{recentPricesStarted}</RecentDataScroller>}

                <Collapse expanded={expandEndDate}>
                    <PriceDateTimePicker
                        label='End Date'
                        placeholder='Date price ends'
                        onChange={(priceEnded) => priceEnded ? priceDTO.setField('priceEnded', priceEnded) : ''}
                        value={priceDTO.value.priceEnded}
                        priceDate={priceDTO.value.priceEnded}
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