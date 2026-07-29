import Input from "./Input"

type Props = React.ComponentPropsWithoutRef<"input"> & {
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
                    <input
                        className={"border border-smoke rounded-sm p-1 w-full " + className}
                        {...props}
                    >
                    </input>
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
                    className={"border border-smoke rounded-sm p-1 w-full " + className}
                    {...props}
                />
            </div>
        </>
    )
}

export default LabeledInput