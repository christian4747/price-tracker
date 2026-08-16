import type { PriceType } from "../../../utils/Types"
import { Button, Modal, TextInput, Tooltip } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { DateTimePicker } from "@mantine/dates"
import { useEditPrice } from "@/hooks/price/useEditPrice"
import { FiCalendar } from "react-icons/fi"
import { MdEdit } from "react-icons/md"
import PriceNumberInput from "../price/PriceNumberInput"

type EditPriceModalProps = {
    price: PriceType
}

const EditPriceModal = ({price}: EditPriceModalProps) => {

    // Track state of modal open/close
    const [opened, { open, close }] = useDisclosure(false)

    // Hook for editing prices
    const { priceDTO, mutation } = useEditPrice(price)

    return (
        <>
            <Modal
                opened={opened}
                onClose={close}
                title="Edit Price"
            >
                <PriceNumberInput
                    label="Price"
                    className="mb-2 min-w-75"
                    withAsterisk
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
                />
                
                <PriceNumberInput
                    label="Return Amount"
                    className="mb-2"
                    value={priceDTO.value.returnAmount}
                    max={priceDTO.value.amount}
                    onChange={(val) => {
                            if (val && priceDTO.value.amount > 0) {
                                priceDTO.setPriceDTO(prev => ({...prev, returnAmount: val as number}))
                            } else {
                                priceDTO.setPriceDTO(prev => ({...prev, returnAmount: 0.00}))
                            }
                        }
                    }
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

                <Button fullWidth className="mt-5" onClick={(e) => {mutation.mutate();close();e.stopPropagation()}}>Edit Price</Button>
            </Modal>
            <div
                className="hidden group-hover/product:block cursor-pointer"
                onClick={(e) => {
                    open()
                    e.stopPropagation()
                }}
            >
                <Tooltip withArrow label="Edit Price"><MdEdit /></Tooltip>
            </div>
        </>
    )
}

export default EditPriceModal