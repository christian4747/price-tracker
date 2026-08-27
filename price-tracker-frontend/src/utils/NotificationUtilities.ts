import { notifications } from "@mantine/notifications"

/**
 * Sends a notification to communicate success to the user.
 * @param message The message to send in the notification
 */
const sendSuccessNotification = (message: string) => {
    notifications.show({
        message: message,
        color: 'green',
        position: 'bottom-right'
    })
}

/**
 * Sends a notification to communicate an error to the user.
 * @param message The message to send in the notification
 */
const sendErrorNotification = (message: string) => {
    notifications.show({
        message: message,
        color: 'red',
        position: 'top-center'
    })
}

export { sendSuccessNotification, sendErrorNotification }