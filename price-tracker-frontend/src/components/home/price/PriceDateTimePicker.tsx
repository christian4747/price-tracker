import { DateTimePicker, type DateTimePickerProps } from "@mantine/dates"
import dayjs from "dayjs"
import { FiCalendar } from "react-icons/fi"

export const PriceDateTimePicker = ({ value, ...props }: DateTimePickerProps) => {
    return (
        <DateTimePicker
            radius='xl'
            rightSectionPointerEvents='none'
            rightSection={
                <div className='pr-2'>
                    <FiCalendar size={24} />
                </div>
            }
            valueFormat='MMM DD, YYYY H:mm A'
            presets={[
                { value: dayjs(value).startOf('day').format('MMM DD, YYYY H:mm A'), label: '00:00' },
                { value: dayjs(value).endOf('day').second(0).toDate().toString(), label: '23:59' }
            ]}
            className='mb-2'
            value={value}
            {...props}
        />
    )
}