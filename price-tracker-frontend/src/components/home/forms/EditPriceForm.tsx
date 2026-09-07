import type { PriceType } from "../../../utils/Types"
import { Button, TextInput } from "@mantine/core"
import { useEditPrice } from "@/hooks/price/useEditPrice"
import PriceNumberInput from "../price/PriceNumberInput"
import { getFormattedDateString } from "@/utils/DateUtilities"
import { RecentDataScroller } from "@/components/common/RecentDataScroller"
import { PriceDateTimePicker } from "../price/PriceDateTimePicker"
import { useRecentPriceData } from "@/hooks/price/useRecentPriceData"
import { useEffect } from "react"

interface EditPriceForm {
    price: PriceType
    closeEditPrice: () => void
}

export const EditPriceForm = ({ price, closeEditPrice }: EditPriceForm) => {

    // Hook for editing prices
    const { priceDTO, mutation } = useEditPrice(price)
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

    const finalizeEditPrice = (e: React.MouseEvent) => {
        mutation.mutate()
        closeEditPrice()
        e.stopPropagation()
    }

    const changeBasePrice = (amount: number) => {
        priceDTO.setField('amount', amount)
    }

    const changeDiscountAmount = (discountAmount: number) => {
        priceDTO.setField('discountAmount', discountAmount)
        priceDTO.setField('discountPercentage', (priceDTO.value.amount - discountAmount) / priceDTO.value.amount)
    }

    const changeDiscountPercentage = (discountPercentage: number) => {
        priceDTO.setField('discountPercentage', discountPercentage)
        priceDTO.setField('discountAmount', priceDTO.value.amount - priceDTO.value.amount * (discountPercentage))
    }

    const changeReturnAmount = (returnAmount: number) => {
        priceDTO.setField('returnAmount', returnAmount)
        priceDTO.setField('returnPercentage', returnAmount / Math.min(priceDTO.value.discountAmount, priceDTO.value.amount))
    }

    const changeReturnPercentage = (returnPercentage: number) => {
        priceDTO.setField('returnPercentage', returnPercentage)
        priceDTO.setField('returnAmount',  Math.min(priceDTO.value.discountAmount, priceDTO.value.amount) * (returnPercentage))
    }

    useEffect(() => {
        changeDiscountPercentage(priceDTO.value.discountPercentage)
    }, [priceDTO.value.amount])

    useEffect(() => {
        changeReturnPercentage(priceDTO.value.returnPercentage)
    }, [priceDTO.value.discountAmount])

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
                    value={priceDTO.value.discountPercentage * 100}
                    max={100}
                    onChange={(discountPercentage) => changeDiscountPercentage(discountPercentage as number / 100)}
                />
            </div>

            <div className='flex gap-1 mb-2'>
                <PriceNumberInput
                    label="Return Amount"
                    className="mb-2 w-75"
                    value={priceDTO.value.returnAmount}
                    max={priceDTO.value.discountAmount}
                    onChange={(returnAmount) => changeReturnAmount(returnAmount as number)}
                />
                <PriceNumberInput
                    label='Return %'
                    className='max-w-25'
                    value={priceDTO.value.returnPercentage * 100}
                    max={100}
                    onChange={(returnPercentage) => changeReturnPercentage(returnPercentage as number / 100)}
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

            <PriceDateTimePicker
                label='Start Date'
                withAsterisk
                onChange={(priceStarted) => priceStarted ? priceDTO.setField('priceStarted', priceStarted) : ''}
                value={priceDTO.value.priceStarted}
            />
            {recentPricesStarted?.length > 0 && <RecentDataScroller className='mb-2'>{recentPricesStarted}</RecentDataScroller>}

            <Button fullWidth className="mt-5" onClick={finalizeEditPrice}>Edit Price</Button>
        </>
    )
}