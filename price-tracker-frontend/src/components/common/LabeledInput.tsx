import type { InputProps } from "@mantine/core"
import Input from "./Input"

type Props = React.ComponentPropsWithoutRef<"input"> & InputProps &  {
    label: string
}

const LabeledInput = ({children, className, required, label, ...props}: Props) => {

    if (required) {
        return (
            <>
                <div className="flex flex-col items-start gap-1 w-full">
                    <div className="font-bold">
                        {label} <span className="text-red-500">*</span>
                    </div>
                    <Input
                        {...props}
                    >
                    </Input>
                </div>
            </>
        )
    }

    return (
        <>
            <div className="flex flex-col items-start gap-1 w-full">
                <div className="font-bold">
                    {label}
                </div>
                <Input
                    {...props}
                />
            </div>
        </>
    )
}

export default LabeledInput