import { Button } from "@mantine/core"

type Props = React.ComponentPropsWithoutRef<"button"> & {
    children?: React.ReactNode,
    className?: string
}

const ButtonWrapper = ({children, className, ...props}: Props) => {
    return (
        <Button color="var(--color-raisin)" radius="xl" className={'min-w-30 min-h-8 rounded-xl font-normal text-cloud flex justify-center items-center cursor-pointer ' + className} {...props}>
            {children}
        </Button>
    )
}

export default ButtonWrapper