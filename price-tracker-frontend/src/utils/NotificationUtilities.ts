import { notifications } from "@mantine/notifications"

const sendSuccessNotification = (message: string) => {
    notifications.show({
        message: message,
        color: 'green',
        position: 'bottom-right'
    })
}

const sendErrorNotification = (message: string) => {
    notifications.show({
        message: message,
        color: 'red',
        position: 'top-center'
    })
}

export { sendSuccessNotification, sendErrorNotification }