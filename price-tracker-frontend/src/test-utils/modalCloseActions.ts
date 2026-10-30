import type { UserEvent } from '@testing-library/user-event'

const getOpenModalElement = (className: string) => {
    const element = document.querySelector(`.${className}`)
    if (!element) throw new Error(`No open modal has an element with class ${className}`)
    return element
}

// Every way a user can close a modal without using its submit button
export const modalCloseActions = {
    closeButton: (user: UserEvent) => user.click(getOpenModalElement('mantine-Modal-close')),
    escapeKey: (user: UserEvent) => user.keyboard('{Escape}'),
    clickOutside: (user: UserEvent) => user.click(getOpenModalElement('mantine-Modal-overlay'))
}

export const tryEveryModalCloseAction = async (user: UserEvent) => {
    for (const closeAction of Object.values(modalCloseActions)) {
        await closeAction(user)
    }
}
