import { describe, expect } from 'vitest'
import { useState } from 'react'
import { renderWithClient, screen, test } from '@/test-utils'
import { SaveModal } from './SaveModal'

/**
 * A save modal that starts open, saving or not.
 * @param props.pending Whether a save is in progress
 */
function OpenSaveModal({ pending }: { pending: boolean }) {
    const [opened, setOpened] = useState(true)

    return <SaveModal pending={pending} opened={opened} onClose={() => setOpened(false)} title="Save something" />
}

/**
 * Go back one entry, as the back gesture or button does, and wait for the browser to finish. The current entry has to
 * be the modal's own, so a missing one fails the test here rather than going back past the test's page.
 */
const goBack = async () => {
    expect(history.state).toMatchObject({ closeOnBackEntry: expect.any(Number) })
    const wentBack = new Promise((resolve) => window.addEventListener('popstate', resolve, { once: true }))
    history.back()
    await wentBack
}

describe('SaveModal', () => {
    // On a phone the back gesture is how people close what covers the screen
    test('should close on going back', async () => {
        renderWithClient(<OpenSaveModal pending={false} />)

        await goBack()

        await expect.poll(() => screen.queryByRole('dialog', { name: 'Save something' })).not.toBeInTheDocument()
    })

    // Closing wouldn't cancel the save, so it stays open as it does when its close button is pressed
    test('should stay open on going back while saving', async () => {
        renderWithClient(<OpenSaveModal pending={true} />)

        await goBack()
        // Long enough for a close that shouldn't happen to show
        await new Promise((resolve) => setTimeout(resolve, 100))

        expect(screen.getByRole('dialog', { name: 'Save something' })).toBeInTheDocument()
    })
})
