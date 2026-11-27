import { Modal, getDefaultZIndex } from '@mantine/core'
import { useMediaQuery, useWindowEvent } from '@mantine/hooks'
import { useRef } from 'react'
import { PHONE_MEDIA_QUERY } from '@/utils/mediaQueries'
import { useCloseOnBack } from '@/hooks/common/useCloseOnBack'

interface ProductDetailsModal {
    opened: boolean
    onClose: () => void
    header: React.ReactNode
    // Buttons for the product, shown beside the close button, such as its actions menu
    actions?: React.ReactNode
    children: React.ReactNode
}

// Centers the header's buttons on the title bar's first line, which is as tall as a row's (min-h-11.25), so they line
// up with the price beside them. 1.75rem is the buttons' own height.
const HEADER_BUTTONS_OFFSET = 'calc((var(--spacing) * 11.25 - 1.75rem) / 2)'

// A product's details in a large window of their own, opened from the product's row, which fills the screen on a
// phone. The header shows the row's title bar, so the name, banner, discount, and price stay in view above the chart
// and price list, with the product's actions beside it, since the window covers the row's own.
export const ProductDetailsModal = ({ opened, onClose, header, actions, children }: ProductDetailsModal) => {
    // Read on the first render rather than after it, so the window doesn't open centered and then jump to fill a
    // phone's screen
    const isPhone = useMediaQuery(PHONE_MEDIA_QUERY, undefined, { getInitialValueInEffect: false })
    // Something inside this modal's own window, to find the window from
    const bodyRef = useRef<HTMLDivElement>(null)

    /**
     * Close the details on Escape, unless the Escape belongs to something open on top of them. Mantine closes every
     * open modal on an Escape anywhere in the window, so with its own handling, Escape in a price modal opened from
     * these details would close both. So this modal turns that off and decides here instead.
     * @param event The key press, from anywhere in the window
     */
    const closeOnEscape = (event: KeyboardEvent) => {
        if (event.key !== 'Escape' || event.isComposing || !opened) return
        if (!(event.target instanceof Element)) return
        // Set by Mantine on menus, and on inputs with an open dropdown, which close themselves on this Escape. Mantine's
        // own modals check it too
        if (event.target.getAttribute('data-mantine-stop-propagation') === 'true') return
        // The innermost window around the key press. Focus can also fall back to the page itself, outside any window,
        // as after picking a store from a dropdown, and Escape should still close the details then
        const dialog = bodyRef.current?.closest('[role=dialog]')
        const targetDialog = event.target.closest('[role=dialog]')
        if (!targetDialog || targetDialog === dialog) onClose()
    }
    useWindowEvent('keydown', closeOnEscape)

    // Going back closes the details rather than leaving the page, as the back gesture does for what fills a phone's
    // screen. Desktop browsers' back button works the same way.
    useCloseOnBack(opened, onClose)

    return (
        // Built from Mantine's modal parts rather than its one Modal, so the actions can sit beside the close button
        // instead of inside the title, where screen readers would read them as part of the window's name
        <Modal.Root
            opened={opened}
            onClose={onClose}
            closeOnEscape={false}
            // Kept in the page while closed, as the rows' panels were, so each product keeps its time range until the
            // page reloads. Mantine pauses what it keeps, so closed details don't fetch prices.
            keepMounted
            // One step under every other modal, so whatever opens over the details is drawn on top of them, even a modal
            // that comes earlier in the page. Modals share one layer and otherwise stack in page order, and the page's
            // own product modals, such as Delete Product, mount with the list, before the rows and their details.
            zIndex={getDefaultZIndex('modal') - 1}
            size="70rem"
            fullScreen={isPhone}
            centered={!isPhone}
            // The title takes the header's width beside the buttons, so the price sits at its right end, as in the row
            classNames={{ title: 'flex-1' }}
            styles={{
                // The buttons stay at the top when the title takes several lines, instead of Mantine's centering
                header: { alignItems: 'flex-start' },
                // The theme makes modal titles large and bold as inline styles, which classes can't override. The
                // title bar brings the row's own sizes and weights instead.
                title: { fontSize: '1rem', lineHeight: 'normal', fontWeight: 400 },
                // The same space under the dates line as above it (pt-3 in ProductDetails), so the dates sit centered
                // between the chart and price list and the bottom of the window. Tailwind's own spacing unit keeps the
                // two in step at every root font size.
                body: { paddingBottom: 'calc(var(--spacing) * 3)' }
            }}
        >
            <Modal.Overlay />
            <Modal.Content>
                <Modal.Header>
                    <Modal.Title>{header}</Modal.Title>
                    <div className="flex shrink-0 items-center gap-1" style={{ marginTop: HEADER_BUTTONS_OFFSET }}>
                        {actions}
                        {/* Mantine's close button is only an icon, so it needs a name for screen readers */}
                        <Modal.CloseButton aria-label="Close details" />
                    </div>
                </Modal.Header>
                <Modal.Body>
                    <div ref={bodyRef}>{children}</div>
                </Modal.Body>
            </Modal.Content>
        </Modal.Root>
    )
}
