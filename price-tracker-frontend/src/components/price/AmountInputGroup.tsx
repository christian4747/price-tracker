import { Button } from '@mantine/core'
import type { PriceDTO } from '@/types/price'
import PriceNumberInput from './PriceNumberInput'

import { getDiscountAmount, getReturnAmount } from '@/utils/priceUtils'
import { RecentDataScroller } from '@/components/common/RecentDataScroller'

// Connects a number field to the function that updates its amount. Mantine's NumberInput gives some values as text while
// they're typed (like "80.0"), and an empty string when the field is cleared. An empty field changes nothing while it's
// being typed in, so a new number can be typed after clearing it, and counts as 0 once it's left, so what's saved
// matches what's shown.
const numberFieldHandlers = (change: (amount: number) => void) => ({
    onChange: (input: number | string) => {
        if (input !== '') change(Number(input))
    },
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
        if (event.currentTarget.value === '') change(0)
    }
})

interface AmountInputGroup {
    value: PriceDTO
    setField: (key: string, value: number | string) => void
    baseAmounts?: number[]
    discountPercentages?: number[]
    returnPercentages?: number[]
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

    // With a base amount of 0 there's no percentage to work out, so the current one stays
    const changeDiscountAmount = (discountAmount: number) => {
        setField('discountAmount', discountAmount)
        if (value.amount !== 0) {
            setField('discountPercentage', (value.amount - discountAmount) / value.amount)
        }
        updateReturnAmount(value.amount, discountAmount)
    }

    const changeDiscountPercentage = (discountPercentage: number) => {
        const discountAmount = getDiscountAmount(value.amount, discountPercentage)
        setField('discountPercentage', discountPercentage)
        setField('discountAmount', discountAmount)
        updateReturnAmount(value.amount, discountAmount)
    }

    // Likewise, with nothing to return a share of, the current percentage stays
    const changeReturnAmount = (returnAmount: number) => {
        setField('returnAmount', returnAmount)
        const returnBase = Math.min(value.discountAmount, value.amount)
        if (returnBase !== 0) {
            setField('returnPercentage', returnAmount / returnBase)
        }
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
                {...numberFieldHandlers(changeBasePrice)}
            />
            {recentBaseAmounts && recentBaseAmounts.length > 0 && (
                <RecentDataScroller className="mb-2">{recentBaseAmounts}</RecentDataScroller>
            )}

            {/* In the discount and return rows, the amount takes the row's spare room and the percentage keeps a
                narrow width, since it never needs more than "100.00" */}
            <div className="flex gap-1 mb-2">
                <PriceNumberInput
                    label="Discount Amount"
                    className="flex-1"
                    value={value.discountAmount}
                    max={value.amount}
                    {...numberFieldHandlers(changeDiscountAmount)}
                />
                <PriceNumberInput
                    label="Discount %"
                    className="w-25"
                    value={value.discountPercentage * 100}
                    max={100}
                    {...numberFieldHandlers((percentage) => changeDiscountPercentage(percentage / 100))}
                />
            </div>
            {recentDiscountPercentages && recentDiscountPercentages.length > 0 && (
                <RecentDataScroller className="mb-2">{recentDiscountPercentages}</RecentDataScroller>
            )}

            <div className="flex gap-1 mb-2">
                <PriceNumberInput
                    label="Return Amount"
                    className="flex-1"
                    value={value.returnAmount}
                    max={value.discountAmount}
                    {...numberFieldHandlers(changeReturnAmount)}
                />
                <PriceNumberInput
                    label="Return %"
                    className="w-25"
                    value={value.returnPercentage * 100}
                    max={100}
                    {...numberFieldHandlers((percentage) => changeReturnPercentage(percentage / 100))}
                />
            </div>
            {recentReturnPercentages && recentReturnPercentages.length > 0 && (
                <RecentDataScroller className="mb-2">{recentReturnPercentages}</RecentDataScroller>
            )}
        </>
    )
}
