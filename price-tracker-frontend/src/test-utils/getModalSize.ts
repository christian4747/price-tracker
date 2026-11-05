// The size Mantine gives a modal, such as "lg". Mantine writes a given size as a CSS variable on the element around
// the dialog, like "--modal-size: var(--modal-size-lg)", so it can be read without the app's styles loaded. A modal
// without a size gets no variable, and Mantine's styles use its default, "md"
export const getModalSize = (dialog: HTMLElement) => {
    const root = dialog.closest<HTMLElement>('.mantine-Modal-root')
    if (!root) throw new Error('The dialog is not inside a Mantine modal')
    const size = root.style.getPropertyValue('--modal-size')
    return size === '' ? 'md' : size.replace(/^var\(--modal-size-(.+)\)$/, '$1')
}
