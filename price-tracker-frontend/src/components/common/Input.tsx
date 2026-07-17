type Props = {
    children?: any,
    className?: any,
    placeholder?: any
}

const Input = (props: Props) => {
    return (
        <input
            className="border-1 border-[#BCBBBD] rounded-sm p-1"
            placeholder={props.placeholder}
        >
            {props.children}
        </input>
    )
}

export default Input