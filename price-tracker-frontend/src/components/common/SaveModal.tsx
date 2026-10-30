import { Modal, type ModalProps } from '@mantine/core'

interface SaveModal extends ModalProps {
    pending: boolean
}

// Modal that saves to the backend. Can't be closed until the save ends, since closing wouldn't cancel it
export const SaveModal = ({ pending, onClose, ...props }: SaveModal) => {
    return <Modal onClose={pending ? () => {} : onClose} closeButtonProps={{ disabled: pending }} {...props} />
}
