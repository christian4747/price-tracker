import { describe, expect } from 'vitest'
import { Button, Menu, Modal, TextInput } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { fireEvent, renderWithClient, screen, test, userEvent, within } from '@/test-utils'
import { ProductDetailsModal } from './ProductDetailsModal'

/**
 * Details that open already, with the kinds of things the real details hold: a button beside the title, as the
 * product's actions menu is, a modal that opens on top of them, as Add Price does, and a menu, as each price's
 * actions are.
 */
function DetailsHarness() {
    const [detailsOpened, { close: closeDetails }] = useDisclosure(true)
    const [innerOpened, { open: openInner, close: closeInner }] = useDisclosure(false)

    return (
        <ProductDetailsModal
            opened={detailsOpened}
            onClose={closeDetails}
            header="Product 1"
            actions={<Button>Product actions</Button>}
        >
            <Button onClick={openInner}>Open inner</Button>
            <Modal opened={innerOpened} onClose={closeInner} title="Inner">
                <TextInput label="Amount" />
            </Modal>
            <Menu>
                <Menu.Target>
                    <Button>Price actions</Button>
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Item>Edit</Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </ProductDetailsModal>
    )
}

/**
 * Find the details' own window, as opposed to one opened on top of it.
 * @returns The details' dialog, or null once it's closed
 */
const detailsDialog = () => screen.queryByRole('dialog', { name: 'Product 1' })

describe('ProductDetailsModal', () => {
    // Screen readers say a window's name when it opens, which should be the product, not its buttons too
    test("should show the actions beside the title, outside the window's name", async () => {
        renderWithClient(<DetailsHarness />)

        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveAccessibleName('Product 1')
        expect(within(dialog).getByRole('button', { name: 'Product actions' })).toBeInTheDocument()
    })

    test('should close from its close button', async () => {
        const user = userEvent.setup()
        renderWithClient(<DetailsHarness />)

        await user.click(within(detailsDialog()!).getByRole('button', { name: 'Close details' }))

        expect(detailsDialog()).not.toBeInTheDocument()
    })

    test('should close on Escape', async () => {
        const user = userEvent.setup()
        renderWithClient(<DetailsHarness />)
        // Mantine moves focus into the details when they open, so the Escape is pressed inside them
        await expect.poll(() => detailsDialog()?.contains(document.activeElement)).toBe(true)

        await user.keyboard('{Escape}')

        expect(detailsDialog()).not.toBeInTheDocument()
    })

    // Mantine closes every open modal on an Escape anywhere, which would close the details along with a price modal
    test('should close only the modal on top when Escape is pressed in it', async () => {
        const user = userEvent.setup()
        renderWithClient(<DetailsHarness />)
        await user.click(screen.getByRole('button', { name: 'Open inner' }))
        await user.click(await screen.findByRole('textbox', { name: 'Amount' }))

        await user.keyboard('{Escape}')

        expect(screen.queryByRole('dialog', { name: 'Inner' })).not.toBeInTheDocument()
        expect(detailsDialog()).toBeInTheDocument()
    })

    test('should close only the menu when Escape is pressed in a menu inside it', async () => {
        const user = userEvent.setup()
        renderWithClient(<DetailsHarness />)
        await user.click(screen.getByRole('button', { name: 'Price actions' }))
        await screen.findByRole('menu')

        await user.keyboard('{Escape}')

        await expect.poll(() => screen.queryByRole('menu')).not.toBeInTheDocument()
        expect(detailsDialog()).toBeInTheDocument()
    })

    // Focus can fall back to the page itself, outside any window, as it does after picking a store from a dropdown
    test('should close on Escape when focus is on the page itself', async () => {
        renderWithClient(<DetailsHarness />)

        // Pressed on the page itself. user.keyboard can't do this: it sends keys to the element it last focused, even
        // after focus has left it
        fireEvent.keyDown(document.body, { key: 'Escape' })

        await expect.poll(() => detailsDialog()).not.toBeInTheDocument()
    })
})
