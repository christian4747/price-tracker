import { Input, type InputProps } from "@mantine/core"

type Props = React.ComponentPropsWithoutRef<"input"> & InputProps

const InputWrapper = ({className, ...props}: Props) => {
    return (
        <Input
            radius='xl'
            className={"border border-smoke rounded-sm p-1 w-full " + className}
            {...props}
        />
    )
}

export default InputWrapper