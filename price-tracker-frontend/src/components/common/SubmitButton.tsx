import { Button, type ButtonProps } from '@mantine/core'

interface SubmitButton extends ButtonProps {
    pending: boolean
    onClick: (e: React.MouseEvent) => void
}

// Submit button for modals that save to the backend. Shows the save in progress and can't be clicked again until it ends
export const SubmitButton = ({ pending, ...props }: SubmitButton) => {
    return <Button fullWidth className="mt-5" loading={pending} {...props} />
}
