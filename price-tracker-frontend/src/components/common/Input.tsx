import { Input, type InputProps } from "@mantine/core"

type Props = React.ComponentPropsWithoutRef<"input"> & InputProps

const InputWrapper = ({className, ...props}: Props) => {
    return (
        <Input
            className={"w-full " + className}
            {...props}
        />
    )
}

export default InputWrapper