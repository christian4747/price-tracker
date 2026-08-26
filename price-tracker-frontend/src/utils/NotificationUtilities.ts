import { notifications } from "@mantine/notifications"

const sendSuccessNotification = (message: string) => {
    notifications.show({
        message: message,
        color: 'green',
        position: 'bottom-center'
    })
}

const sendErrorNotification = (message: string) => {
    notifications.show({
        message: message,
        color: 'red',
        position: 'bottom-center'
    })
}

export { sendSuccessNotification, sendErrorNotification }