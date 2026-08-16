import { Accordion } from '@mantine/core'
import { useState } from 'react'
import PriceNumberInput from './PriceNumberInput'

/**
 * Returns the percentage value of the given value and percentage.
 * @param val The original value
 * @param percentage The value's desired percentage
 * @returns The percentage value of the original value
 */
const percentageValue = (val: number, percentage: number) => {
    return val * percentage / 100
}

const PriceCalculator = () => {

    // Track price calculator price
    const [priceCalculatorAmount, setPriceCalculatorAmount] = useState(0)
    // Track price calculator return
    const [priceCalculatorReturn, setPriceCalulatorReturn] = useState(0)
    // Track price w/ discount
    const [discountAmount, setDiscountAmount] = useState(0)
    // Track price discount percentage
    const [discountPercentage, setDiscountPercentage] = useState(0)
    // Track return percentage
    const [returnPercentage, setReturnPercentage] = useState(0)

    /**
     * Resets the discount amount & percentage to 0.
     */
    const resetDiscount = () => {
        setDiscountAmount(0)
        setDiscountPercentage(0)
    }

    /**
     * Resets the return amount & percentage to 0.
     */
    const resetReturn = () => {
        setPriceCalulatorReturn(0)
        setReturnPercentage(0)
    }

    return (
        <Accordion>
            <Accordion.Item value='PriceCalculator'>
                <Accordion.Control>Price Calculator</Accordion.Control>
                <Accordion.Panel>
                    <PriceNumberInput
                        label='Example Price'
                        value={priceCalculatorAmount}
                        max={undefined}
                        onChange={
                            (newPriceAmount) => {
                                newPriceAmount = newPriceAmount as number
                                if (newPriceAmount > 0) {
                                    // Calculate discount
                                    const priceMinusDiscount = newPriceAmount - percentageValue(newPriceAmount, discountPercentage)
                                    // Calculate return
                                    const returnAmount = percentageValue(priceMinusDiscount, returnPercentage)

                                    // Set the amount
                                    setPriceCalculatorAmount(newPriceAmount)
                                    // Set the discount amount
                                    setDiscountAmount(priceMinusDiscount)
                                    // Set the return amount
                                    setPriceCalulatorReturn(returnAmount)
                                } else {
                                    // If the new price amount is 0, reset the other values
                                    resetDiscount()
                                    resetReturn()
                                }
                            }
                        }
                    />

                    <div className='flex gap-1 mb-2'>
                        <PriceNumberInput
                            label='Amount - Discount'
                            className='min-w-65'
                            value={discountAmount}
                            max={priceCalculatorAmount}
                            onChange={
                                (newDiscountAmount) => {
                                    newDiscountAmount = newDiscountAmount as number
                                    if (priceCalculatorAmount > 0) {
                                        // Calculate discount percentage
                                        const discountPercentage = 100 - newDiscountAmount / priceCalculatorAmount * 100
                                        // Calculate return
                                        const returnAmount = percentageValue(newDiscountAmount, returnPercentage)

                                        // Set the discount amount
                                        setDiscountAmount(newDiscountAmount)
                                        // Set the discount percentage
                                        setDiscountPercentage(discountPercentage)
                                        // Set the new return amount
                                        setPriceCalulatorReturn(returnAmount)
                                    } else {
                                        // If the current price amount is 0, reset the other values
                                        resetDiscount()
                                        resetReturn()
                                    }
                                }
                            }
                        />

                        <PriceNumberInput
                            label='Discount %'
                            className='max-w-25'
                            value={discountPercentage}
                            onChange={
                                (newDiscountPercentage) => {
                                    newDiscountPercentage = newDiscountPercentage as number
                                    if (priceCalculatorAmount > 0) {
                                        // Calculate discount
                                        const priceMinusDiscount = priceCalculatorAmount - percentageValue(priceCalculatorAmount, newDiscountPercentage)
                                        // Calculate return
                                        const returnAmount = percentageValue(priceMinusDiscount, returnPercentage)

                                        // Set the new discount percentage
                                        setDiscountPercentage(newDiscountPercentage)
                                        // Set the new discount
                                        setDiscountAmount(priceMinusDiscount)
                                        // Set the new price return
                                        setPriceCalulatorReturn(returnAmount)
                                    } else {
                                        // If the current price amount is 0, reset the other values
                                        resetDiscount()
                                        resetReturn()
                                    }
                                }
                            }
                        />
                    </div>

                    <div className='flex gap-1 mb-2'>
                        <PriceNumberInput
                            label='Return Amount'
                            className='min-w-65'
                            value={priceCalculatorReturn}
                            max={discountAmount}
                            onChange={
                                (newReturnAmount) => {
                                    newReturnAmount = newReturnAmount as number
                                    if (priceCalculatorAmount - discountAmount > 0) {
                                        // Calculate the return percentage
                                        const returnPercentage = newReturnAmount / discountAmount * 100

                                        // Set the new return amount
                                        setPriceCalulatorReturn(newReturnAmount)
                                        // Set the return percentage
                                        setReturnPercentage(returnPercentage)
                                    } else {
                                        // If the current price amount is 0, reset the other values
                                        resetReturn()
                                    }
                                }
                            }
                        />

                        <PriceNumberInput
                            label='Return %'
                            className='max-w-25'
                            value={returnPercentage}
                            onChange={
                                (newReturnPercentage) => {
                                    newReturnPercentage = newReturnPercentage as number
                                    if (priceCalculatorAmount - discountAmount > 0) {
                                        // Calculate the return amount
                                        const returnAmount = percentageValue(discountAmount, newReturnPercentage)

                                        // Set the return amount
                                        setPriceCalulatorReturn(returnAmount)
                                        // Set the new return percentage
                                        setReturnPercentage(newReturnPercentage)
                                    } else {
                                        // If the current price amount is 0, reset the other values
                                        resetReturn()
                                    }
                                }
                            }
                        />
                    </div>
                </Accordion.Panel>
            </Accordion.Item>
        </Accordion>
    )
}

export default PriceCalculator