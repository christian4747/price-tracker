type Props = React.ComponentPropsWithoutRef<"button"> & {
    children?: React.ReactNode,
    className?: string
}

const Button = ({children, className, ...props}: Props) => {
    return (
        <button className={'hover:bg-raisin-hover min-w-30 min-h-8 rounded-xl bg-raisin text-cloud flex justify-center items-center cursor-pointer ' + className} {...props}>
            {children}
        </button>
    )
}

export default Button