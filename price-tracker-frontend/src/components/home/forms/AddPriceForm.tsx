
import { Button, Center, Collapse, Switch, TextInput } from '@mantine/core'
import type { ProductType } from '@/utils/Types'
import PriceNumberInput from '../price/PriceNumberInput'
import { RecentDataScroller } from '@/components/common/RecentDataScroller'
import { PriceDateTimePicker } from '../price/PriceDateTimePicker'
import { useState } from 'react'
import { getFormattedDateString } from '@/utils/DateUtilities'
import { useDisclosure } from '@mantine/hooks'
import { getHighestPrice } from '@/utils/PriceUtilities'
import { useAddPrice } from '@/hooks/price/useAddPrice'
import { useRecentPriceData } from '@/hooks/price/useRecentPriceData'

interface AddPriceForm {
    product: ProductType
    setDateToday: (newVal: Date) => void
}

export const AddPriceForm = ({ product, setDateToday }: AddPriceForm) => {

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

    const setAmount = (amount: number) => {
        if (!amount) {
            priceDTO.setField('amount', 0)
            priceDTO.setField('returnAmount', 0)
        } else {
            priceDTO.setField('amount', amount)
            priceDTO.setField('returnAmount', Math.min(amount, priceDTO.value.returnAmount))
        }
    }

    const finalizeAddPrice = () => {
        useEndDate ? multiMutation.mutate() : singleMutation.mutate()
        close()
        setDateToday(new Date())
    }

    const changeBasePrice = (amount: number) => {
        priceDTO.setField('amount', amount)
    }

    const changeDiscountAmount = (discountAmount: number) => {
        priceDTO.setField('discountAmount', discountAmount)
        priceDTO.setField('discountPercentage', (priceDTO.value.amount - discountAmount) / priceDTO.value.amount * 100)
    }

    const changeDiscountPercentage = (discountPercentage: number) => {
        priceDTO.setField('discountPercentage', discountPercentage)
        priceDTO.setField('discountAmount', priceDTO.value.amount - priceDTO.value.amount * (discountPercentage / 100))
    }

    const changeReturnAmount = (returnAmount: number) => {
        priceDTO.setField('returnAmount', returnAmount)

        if (priceDTO.value.discountAmount > 0) {
            priceDTO.setField('returnPercentage', returnAmount / priceDTO.value.discountAmount * 100)
        } else {
            priceDTO.setField('returnPercentage', returnAmount / priceDTO.value.amount * 100)
        }
    }

    const changeReturnPercentage = (returnPercentage: number) => {
        priceDTO.setField('returnPercentage', returnPercentage)

        if (priceDTO.value.discountAmount > 0) {
            priceDTO.setField('returnAmount',  priceDTO.value.discountAmount * (returnPercentage / 100))
        } else {
            priceDTO.setField('returnAmount', priceDTO.value.amount * (returnPercentage / 100))
        }
    }

    return (
        <>
            <PriceNumberInput
                label="Base Price"
                className="mb-2 min-w-75"
                withAsterisk
                value={priceDTO.value.amount}
                onChange={(amount) => changeBasePrice(amount as number)}
            />

            <div className='flex gap-1 mb-2'>
                <PriceNumberInput
                    label="Discount Amount"
                    className="mb-2 w-75"
                    value={priceDTO.value.discountAmount}
                    max={priceDTO.value.amount}
                    onChange={(discountAmount) => changeDiscountAmount(discountAmount as number)}
                />
                <PriceNumberInput
                    label='Discount %'
                    className='max-w-25'
                    value={priceDTO.value.discountPercentage}
                    max={100}
                    onChange={(discountPercentage) => changeDiscountPercentage(discountPercentage as number)}
                />
            </div>

            <div className='flex gap-1 mb-2'>
                <PriceNumberInput
                    label="Return Amount"
                    className="mb-2 w-75"
                    value={priceDTO.value.returnAmount}
                    max={priceDTO.value.amount - priceDTO.value.discountAmount}
                    onChange={(returnAmount) => changeReturnAmount(returnAmount as number)}
                />
                <PriceNumberInput
                    label='Return %'
                    className='max-w-25'
                    value={priceDTO.value.returnPercentage}
                    max={100}
                    onChange={(returnPercentage) => changeReturnPercentage(returnPercentage as number)}
                />
            </div>

            <TextInput
                label="Description"
                radius='xl'
                placeholder="Description"
                onChange={(e) => priceDTO.setField('description', e.target.value)}
                value={priceDTO.value.description}
                className="mb-2"
            />
            {recentDescriptions?.length > 0 && <RecentDataScroller className='mb-2'>{recentDescriptions}</RecentDataScroller>}

            <TextInput
                label="Currency"
                radius='xl'
                placeholder="ex. USD"
                onChange={(e) => priceDTO.setField('currency', e.target.value)}
                value={priceDTO.value.currency}
                className="mb-2"
            />
            {recentCurrencies?.length > 0 && <RecentDataScroller className='mb-2'>{recentCurrencies}</RecentDataScroller>}

            <Center>
                <Button.Group>
                    <Button
                        variant={useEndDate ? "default" : "filled"}
                        onClick={() => { setUseEndDate(false); closeEndDate() }}
                    >
                        Start Date Only
                    </Button>
                    <Button
                        variant={useEndDate ? "filled" : "default"}
                        onClick={() => { setUseEndDate(true); openEndDate() }}
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
            />
            {recentPricesStarted?.length > 0 && <RecentDataScroller className='mb-2'>{recentPricesStarted}</RecentDataScroller>}

            <Collapse expanded={expandEndDate}>
                <PriceDateTimePicker
                    label='End Date'
                    onChange={(priceEnded) => priceEnded ? priceDTO.setField('priceEnded', priceEnded) : ''}
                    value={priceDTO.value.priceEnded}
                />
                {recentPricesEnded?.length > 0 && <RecentDataScroller className='mb-2'>{recentPricesEnded}</RecentDataScroller>}

                <Switch
                    label='Use same description for end date'
                    checked={useEndDateDesc}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setUseEndDateDesc(e.target.checked) }}
                />
            </Collapse>

            <Button className="mt-5" fullWidth onClick={finalizeAddPrice}>
                Add Price
            </Button>
        </>
    )
}