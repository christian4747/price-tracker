type Props = React.ComponentPropsWithoutRef<"input">

const Input = ({children, className, ...props}: Props) => {
    return (
        <>
            <input
                className={"border border-smoke rounded-sm p-1 w-full " + className}
                {...props}
            />
        </>
    )
}

export default Input