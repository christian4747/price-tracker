
import { Button, Center, Collapse, Modal, NumberInput, TextInput } from '@mantine/core'
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
}

const AddPriceModal = ({ product }: AddPriceModalProps) => {

    // Track state of modal open/close
    const [opened, { open, close }] = useDisclosure(false)
    // Track state of expanding the end date input
    const [expandEndDate, { open: openEndDate, close: closeEndDate }] = useDisclosure(false)
    // Track button group state for selecting start date or start + end date
    const [useEndDate, setUseEndDate] = useState(false)

    // Hook for adding prices
    const { priceDTO, mutation: multiMutation, singleMutation } = useAddPrice(product, getHighestPrice(product?.prices))

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
                <NumberInput
                    label="Price"
                    withAsterisk
                    radius='xl'
                    placeholder=""
                    value={priceDTO.value.amount}
                    onChange={(val) => {val ? priceDTO.setPriceDTO(prev => ({...prev, amount: val.toString()})) : priceDTO.setPriceDTO(prev => ({...prev, amount: '0.00'}))}}
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
                    />
                </Collapse>

                <Button
                    className="mt-5"
                    fullWidth
                    onClick={
                        () => {
                            useEndDate || priceDTO.value.priceEnded?.length === 0 ? multiMutation.mutate() : singleMutation.mutate()
                            close()
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