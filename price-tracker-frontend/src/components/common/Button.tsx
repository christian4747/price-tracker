type Props = {
    children?: React.ReactNode,
    onClick?: any,
    className?: string
}

const Button = ({children, onClick, className}: Props) => {
    const buttonClass = `min-w-25 min-h-10 rounded-md bg-[#332933] text-[#F4F4F4] flex justify-center items-center font-bold ${className}`

    return (
        <button onClick={onClick} className={buttonClass + " cursor-pointer"}>
            {children}
        </button>
    )
}

export default Button