import type { PriceDTO } from "../../../utils/Types"
import PriceNumberInput from "./PriceNumberInput"

import { useEffect } from "react"

interface AmountInputGroup {
    value: PriceDTO
    setField: (key: string, value: number | string) => void
}

export const AmountInputGroup = ({ value, setField }: AmountInputGroup) => {

    const changeBasePrice = (amount: number) => {
        setField('amount', amount)
    }

    const changeDiscountAmount = (discountAmount: number) => {
        setField('discountAmount', discountAmount)
        setField('discountPercentage', (value.amount - discountAmount) / value.amount)
    }

    const changeDiscountPercentage = (discountPercentage: number) => {
        setField('discountPercentage', discountPercentage)
        setField('discountAmount', value.amount - value.amount * (discountPercentage))
    }

    const changeReturnAmount = (returnAmount: number) => {
        setField('returnAmount', returnAmount)
        setField('returnPercentage', returnAmount / Math.min(value.discountAmount, value.amount))
    }

    const changeReturnPercentage = (returnPercentage: number) => {
        setField('returnPercentage', returnPercentage)
        setField('returnAmount', Math.min(value.discountAmount, value.amount) * (returnPercentage))
    }

    useEffect(() => {
        changeDiscountPercentage(value.discountPercentage)
    }, [value.amount])

    useEffect(() => {
        changeReturnPercentage(value.returnPercentage)
    }, [value.discountAmount])

    return (
        <>
            <PriceNumberInput
                label="Base Price"
                className="mb-2 min-w-75"
                withAsterisk
                value={value.amount}
                onChange={(amount) => changeBasePrice(amount as number)}
            />

            <div className='flex gap-1 mb-2'>
                <PriceNumberInput
                    label="Discount Amount"
                    className="w-75"
                    value={value.discountAmount}
                    max={value.amount}
                    onChange={(discountAmount) => changeDiscountAmount(discountAmount as number)}
                />
                <PriceNumberInput
                    label='Discount %'
                    className='max-w-25'
                    value={value.discountPercentage * 100}
                    max={100}
                    onChange={(discountPercentage) => changeDiscountPercentage(discountPercentage as number / 100)}
                />
            </div>

            <div className='flex gap-1 mb-2'>
                <PriceNumberInput
                    label="Return Amount"
                    className="w-75"
                    value={value.returnAmount}
                    max={value.discountAmount}
                    onChange={(returnAmount) => changeReturnAmount(returnAmount as number)}
                />
                <PriceNumberInput
                    label='Return %'
                    className='max-w-25'
                    value={value.returnPercentage * 100}
                    max={100}
                    onChange={(returnPercentage) => changeReturnPercentage(returnPercentage as number / 100)}
                />
            </div>
        </>
    )
}