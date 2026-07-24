type Props = React.ComponentPropsWithoutRef<"button"> & {
    children?: React.ReactNode,
    className?: string
}

const Button = ({children, className, ...props}: Props) => {
    return (
        <button className={'min-w-25 min-h-10 rounded-md bg-raisin text-cloud flex justify-center items-center font-bold cursor-pointer ' + className} {...props}>
            {children}
        </button>
    )
}

export default Button