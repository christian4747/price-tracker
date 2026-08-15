
import { Accordion, Button, Center, Collapse, Modal, NumberInput, Switch, TextInput } from '@mantine/core'
import type { ProductType } from '@/utils/Types'
import { useDisclosure } from '@mantine/hooks'
import { useAddPrice } from '@/hooks/price/useAddPrice'
import { getLocalDateFromUTC } from '@/utils/DateUtilities'
import { getHighestPrice } from '@/utils/PriceUtilities'
import { DateTimePicker } from '@mantine/dates'
import { FiCalendar } from 'react-icons/fi'
import { useState } from 'react'

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

    // Hook for adding prices
    const { priceDTO, mutation: multiMutation, singleMutation } = useAddPrice(product, getHighestPrice(product?.prices), useEndDateDesc)

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
                <Accordion defaultValue='PriceCalculator'>
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

                <NumberInput
                    label="Price"
                    withAsterisk
                    radius='xl'
                    placeholder=""
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
                    step={.01}
                    decimalScale={2}
                    fixedDecimalScale
                    allowNegative={false}
                    className="mb-2 min-w-75"
                />
                
                <NumberInput
                    label="Return Amount"
                    radius='xl'
                    placeholder=""
                    value={priceDTO.value.returnAmount}
                    onChange={(val) => {
                            if (val && priceDTO.value.amount > 0) {
                                priceDTO.setPriceDTO(prev => ({...prev, returnAmount: val as number}))
                                setReturnPercentage((val as number) / (priceDTO.value.amount - discountAmount) * 100)
                            } else {
                                priceDTO.setPriceDTO(prev => ({...prev, returnAmount: 0.00}))
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

                <TextInput
                    label="Description"
                    radius='xl'
                    placeholder="Description"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {priceDTO.setPriceDTO(prev => ({...prev, description: e.target.value}))}}
                    value={priceDTO.value.description}
                    className="mb-2"
                />
                <TextInput
                    label="Currency"
                    radius='xl'
                    placeholder="ex. USD"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {priceDTO.setPriceDTO(prev => ({...prev, currency: e.target.value}))}}
                    value={priceDTO.value.currency}
                    className="mb-2"
                />

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
                    className="mb-2"
                />

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
                        className="mb-2"
                    />
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