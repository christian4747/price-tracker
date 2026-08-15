import { Accordion, NumberInput } from "@mantine/core"
import { useState } from "react"

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

    return (
        <Accordion>
            <Accordion.Item value='PriceCalculator'>
                <Accordion.Control>Price Calculator</Accordion.Control>
                <Accordion.Panel>
                    <NumberInput
                        label="Example Price"
                        radius='xl'
                        value={priceCalculatorAmount}
                        onChange={(val) => {
                                if (val) {
                                    setPriceCalculatorAmount(val as number)
                                    setDiscountAmount((val as number) * discountPercentage / 100)
                                    setPriceCalulatorReturn((val as number - ((val as number) * discountPercentage) / 100) * (returnPercentage / 100))
                                } else {
                                    setDiscountAmount(0)
                                    setDiscountPercentage(0)
                                    setPriceCalulatorReturn(0)
                                    setReturnPercentage(0)
                                }
                            }
                        }
                        step={.01}
                        decimalScale={2}
                        fixedDecimalScale
                        allowNegative={false}
                        className="mb-2"
                    />

                    <div className='flex gap-1'>
                        <NumberInput
                            label="Amount w/ Discount"
                            radius='xl'
                            placeholder=""
                            value={discountAmount}
                            onChange={(val) => {
                                    if (val && priceCalculatorAmount > 0) {
                                        setDiscountAmount(val as number)
                                        setDiscountPercentage((val as number) / (priceCalculatorAmount) * 100)
                                        setPriceCalulatorReturn((priceCalculatorAmount - discountAmount) * (returnPercentage / 100))
                                        setReturnPercentage((val as number) / (discountAmount))
                                    } else {
                                        setDiscountAmount(0)
                                        setDiscountPercentage(0)
                                        setPriceCalulatorReturn(0)
                                        setReturnPercentage(0)
                                    }
                                }
                            }
                            step={.01}
                            decimalScale={2}
                            fixedDecimalScale
                            allowNegative={false}
                            className="mb-2 min-w-65"
                        />

                        <NumberInput
                            label="Discount %"
                            radius='xl'
                            placeholder=""
                            value={discountPercentage}
                            onChange={(val) => {
                                    if (val && priceCalculatorAmount > 0) {
                                        val = Math.min(val as number, 100)
                                        setDiscountAmount(priceCalculatorAmount - (val as number) * (priceCalculatorAmount / 100))
                                        setDiscountPercentage(val as number)
                                        setPriceCalulatorReturn((priceCalculatorAmount - (priceCalculatorAmount * val as number / 100)) * (returnPercentage / 100))
                                    } else {
                                        setDiscountAmount(0)
                                        setDiscountPercentage(0)
                                        setPriceCalulatorReturn(0)
                                        setReturnPercentage(0)
                                    }
                                }
                            }
                            allowNegative={false}
                            decimalScale={2}
                            className="mb-2 max-w-25"
                        />
                    </div>

                    <div className='flex gap-1'>
                        <NumberInput
                            label="Return Amount"
                            radius='xl'
                            placeholder=""
                            value={priceCalculatorReturn}
                            onChange={(val) => {
                                    if (val && priceCalculatorAmount - discountAmount > 0) {
                                        val = Math.min(val as number, priceCalculatorAmount - discountAmount)
                                        setPriceCalulatorReturn(val as number)
                                        setReturnPercentage((val as number) / (priceCalculatorAmount - discountAmount))
                                    } else {
                                        setPriceCalulatorReturn(0)
                                        setReturnPercentage(0)
                                    }
                                }
                            }
                            step={.01}
                            decimalScale={2}
                            fixedDecimalScale
                            allowNegative={false}
                            className="mb-2 min-w-65"
                        />

                        <NumberInput
                            label="Return %"
                            radius='xl'
                            placeholder=""
                            value={returnPercentage}
                            onChange={(val) => {
                                    if (val && priceCalculatorAmount - discountAmount > 0) {
                                        val = Math.min(val as number, 100)
                                        setPriceCalulatorReturn(val as number * ((priceCalculatorAmount - discountAmount) / 100))
                                        setReturnPercentage((val as number))
                                    } else {
                                        setPriceCalulatorReturn(0.00)
                                        setReturnPercentage(0)
                                    }
                                }
                            }
                            allowNegative={false}
                            decimalScale={2}
                            className="mb-2 max-w-25"
                        />
                    </div>
                </Accordion.Panel>
            </Accordion.Item>
        </Accordion>
    )
}

export default PriceCalculator