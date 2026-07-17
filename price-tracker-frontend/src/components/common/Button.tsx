type Props = {
    children?: any,
    onClick?: any,
    className?: any
}

const Button = (props: Props) => {
    const className = `min-w-25 min-h-10 rounded-md bg-[#332933] text-[#F4F4F4] flex justify-center items-center font-bold ${props.className}`

    return (
        <button onClick={props.onClick} className={className + " cursor-pointer"}>
            {props.children}
        </button>
    )
}

export default Button