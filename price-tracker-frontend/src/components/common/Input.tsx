type Props = React.ComponentPropsWithoutRef<"input"> & {
    children?: React.ReactNode,
    className?: string
}

const Input = ({children, className, ...props}: Props) => {
    return (
        <input
            className={"border border-smoke rounded-sm p-1 " + className}
            {...props}
        >
            {children}
        </input>
    )
}

export default Input