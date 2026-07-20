type Props = {
    children?: React.ReactNode,
    className?: string,
    placeholder?: string,
    onChange?: React.ChangeEventHandler<HTMLInputElement, HTMLInputElement> | undefined,
    value?: any,
    type?: string
}

const Input = (props: Props) => {
    return (
        <input
            type={props.type}
            className={"border-1 border-[#BCBBBD] rounded-sm p-1 " + props.className}
            placeholder={props.placeholder}
            onChange={props.onChange}
            value={props.value}
        >
            {props.children}
        </input>
    )
}

export default Input