import { Button } from '@mantine/core'
import type { PriceDTO } from '@/types/price'
import PriceNumberInput from './PriceNumberInput'

import { getDiscountAmount, getReturnAmount } from '@/utils/priceUtils'
import { RecentDataScroller } from '@/components/common/RecentDataScroller'

interface AmountInputGroup {
    value: PriceDTO
    setField: (key: string, value: number | string) => void
    baseAmounts?: []
    discountPercentages?: []
    returnPercentages?: []
}

export const AmountInputGroup = ({
    value,
    setField,
    baseAmounts,
    discountPercentages,
    returnPercentages
}: AmountInputGroup) => {
    // Keeps the return amount in step with its percentage when the amounts it depends on change
    const updateReturnAmount = (amount: number, discountAmount: number) => {
        setField('returnAmount', getReturnAmount(amount, discountAmount, value.returnPercentage))
    }

    // Keeps the discount amount in step with its percentage when the base amount changes
    const changeBasePrice = (amount: number) => {
        const discountAmount = getDiscountAmount(amount, value.discountPercentage)
        setField('amount', amount)
        setField('discountAmount', discountAmount)
        updateReturnAmount(amount, discountAmount)
    }

    const changeDiscountAmount = (discountAmount: number) => {
        setField('discountAmount', discountAmount)
        setField('discountPercentage', (value.amount - discountAmount) / value.amount)
        updateReturnAmount(value.amount, discountAmount)
    }

    const changeDiscountPercentage = (discountPercentage: number) => {
        const discountAmount = getDiscountAmount(value.amount, discountPercentage)
        setField('discountPercentage', discountPercentage)
        setField('discountAmount', discountAmount)
        updateReturnAmount(value.amount, discountAmount)
    }

    const changeReturnAmount = (returnAmount: number) => {
        setField('returnAmount', returnAmount)
        setField('returnPercentage', returnAmount / Math.min(value.discountAmount, value.amount))
    }

    const changeReturnPercentage = (returnPercentage: number) => {
        setField('returnPercentage', returnPercentage)
        setField('returnAmount', getReturnAmount(value.amount, value.discountAmount, returnPercentage))
    }

    const recentBaseAmounts = baseAmounts?.map((baseAmount: number, idx: number) => (
        <Button key={idx} onClick={() => changeBasePrice(baseAmount)}>
            {baseAmount}
        </Button>
    ))

    const recentDiscountPercentages = discountPercentages?.map((discountPercentage: number, idx: number) => (
        <Button key={idx} onClick={() => changeDiscountPercentage(discountPercentage)}>
            {(discountPercentage * 100).toFixed(2)}%
        </Button>
    ))

    const recentReturnPercentages = returnPercentages?.map((returnPercentage: number, idx: number) => (
        <Button key={idx} onClick={() => changeReturnPercentage(returnPercentage)}>
            {(returnPercentage * 100).toFixed(2)}%
        </Button>
    ))

    return (
        <>
            <PriceNumberInput
                label="Base Price"
                className="mb-2 min-w-75"
                withAsterisk
                value={value.amount}
                onChange={(amount) => changeBasePrice(amount as number)}
            />
            {recentBaseAmounts && recentBaseAmounts.length > 0 && (
                <RecentDataScroller className="mb-2">{recentBaseAmounts}</RecentDataScroller>
            )}

            <div className="flex gap-1 mb-2">
                <PriceNumberInput
                    label="Discount Amount"
                    className="w-75"
                    value={value.discountAmount}
                    max={value.amount}
                    onChange={(discountAmount) => changeDiscountAmount(discountAmount as number)}
                />
                <PriceNumberInput
                    label="Discount %"
                    className="max-w-25"
                    value={value.discountPercentage * 100}
                    max={100}
                    onChange={(discountPercentage) => changeDiscountPercentage((discountPercentage as number) / 100)}
                />
            </div>
            {recentDiscountPercentages && recentDiscountPercentages.length > 0 && (
                <RecentDataScroller className="mb-2">{recentDiscountPercentages}</RecentDataScroller>
            )}

            <div className="flex gap-1 mb-2">
                <PriceNumberInput
                    label="Return Amount"
                    className="w-75"
                    value={value.returnAmount}
                    max={value.discountAmount}
                    onChange={(returnAmount) => changeReturnAmount(returnAmount as number)}
                />
                <PriceNumberInput
                    label="Return %"
                    className="max-w-25"
                    value={value.returnPercentage * 100}
                    max={100}
                    onChange={(returnPercentage) => changeReturnPercentage((returnPercentage as number) / 100)}
                />
            </div>
            {recentReturnPercentages && recentReturnPercentages.length > 0 && (
                <RecentDataScroller className="mb-2">{recentReturnPercentages}</RecentDataScroller>
            )}
        </>
    )
}
