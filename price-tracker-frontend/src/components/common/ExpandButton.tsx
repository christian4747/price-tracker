import { MdExpandMore } from "react-icons/md"

type ExpandButtonProps = {
    hidden: boolean,
    setHidden: React.Dispatch<React.SetStateAction<boolean>>
}

const ExpandButton = ({hidden, setHidden}: ExpandButtonProps) => {
    return (
        <div className="cursor-pointer" onClick={() => {setHidden(!hidden)}}>
            <MdExpandMore className={hidden ? "transition duration-300" : "transition duration-300 rotate-180"} size={48} />
        </div>
    )
}

export default ExpandButton