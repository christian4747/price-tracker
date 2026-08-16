import { NumberInput } from "@mantine/core"

// Provide NumberInput with standard Price attributes
const PriceNumberInput = ({...attributes}: NumberInput.Props) => {
    return (
        <NumberInput
            radius='xl'
            step={1}
            decimalScale={2}
            fixedDecimalScale
            allowNegative={false}
            className='mb-2'
            min={0}
            max={100}
            clampBehavior='blur'
            {...attributes}
        />
    )
}

export default PriceNumberInput