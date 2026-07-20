type Props = {
    hidden: boolean,
    children: React.ReactNode
}

const Modal = (props: Props) => {
    return (
        <div
            className={props.hidden ?
                "fixed z-1 left-0 top-0 w-full h-full overflow-auto bg-[rgba(51,41,51,0.4)] flex items-center" :
                "hidden fixed z-1 left-0 top-0 w-full h-full overflow-auto bg-[rgba(51,41,51,0.4)] flex items-center"
            }
        >
            <div className="bg-[#fefefe] m-auto mt-[20vh] p-3 min-w-2/10 max-h-5/10 rounded-sm flex flex-col gap-2 justify-between">
                {props.children}
            </div>
        </div>
    )
}

export default Modal