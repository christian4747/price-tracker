import { MdClose } from "react-icons/md"

type Props = React.ComponentPropsWithoutRef<"div"> & {
    toggleHidden: () => void
}

const ModalHeader = ({children, className, toggleHidden, ...props}: Props) => {
    return (
        <div className="text-4xl font-mono font-bold flex justify-between items-center" {...props}>
            <div>{children}</div>
            <div className="cursor-pointer" onClick={toggleHidden}><MdClose/></div>
        </div>
    )
}

export default ModalHeader