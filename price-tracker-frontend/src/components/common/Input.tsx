type Props = {
    children?: React.ReactNode,
    className?: string,
    placeholder?: string,
    onChange?: React.ChangeEventHandler<HTMLInputElement, HTMLInputElement> | undefined,
    value?: any,
    type?: string
}

const Input = ({children, className, placeholder, onChange, value, type}: Props) => {
    return (
        <input
            type={type}
            className={"border-1 border-[#BCBBBD] rounded-sm p-1 " + className}
            placeholder={placeholder}
            onChange={onChange}
            value={value}
        >
            {children}
        </input>
    )
}

export default Input