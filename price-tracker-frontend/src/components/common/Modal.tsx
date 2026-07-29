type Props = {
    hidden: boolean,
    children: React.ReactNode
}

const Modal = ({hidden, children}: Props) => {
    return (
        <div
            className={hidden ?
                "fixed z-1 left-0 top-0 w-full h-full overflow-auto bg-raisin/40 flex items-center" :
                "hidden fixed z-1 left-0 top-0 w-full h-full overflow-auto bg-raisin/40 items-center"
            }
        >
            <div className="bg-cloud m-auto mt-[20vh] p-3 min-w-3/10 max-w-3/10 max-h-6/10 rounded-sm flex flex-col gap-2 justify-between text-center">
                {children}
            </div>
        </div>
    )
}

export default Modal