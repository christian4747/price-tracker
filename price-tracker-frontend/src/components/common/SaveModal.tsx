import { Modal, type ModalProps } from '@mantine/core'
import { useCloseOnBack } from '@/hooks/common/useCloseOnBack'

interface SaveModal extends ModalProps {
    pending: boolean
}

// Modal that saves to the backend. Can't be closed until the save ends, since closing wouldn't cancel it
export const SaveModal = ({ pending, onClose, ...props }: SaveModal) => {
    const closeUnlessSaving = pending ? () => {} : onClose
    // Going back closes it, as the back gesture does for what covers a phone's screen, and only it when it's open over
    // a product's details. While saving, going back leaves it open, as its close button does.
    useCloseOnBack(props.opened, closeUnlessSaving)

    return <Modal onClose={closeUnlessSaving} closeButtonProps={{ disabled: pending }} {...props} />
}
