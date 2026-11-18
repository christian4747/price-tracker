import { describe, expect } from 'vitest'
import { useState } from 'react'
import { render, screen, test, userEvent } from '@/test-utils'
import { useCloseOnBack } from './useCloseOnBack'

/**
 * Something that starts open and closes on going back, with a button that closes it another way, as a modal's close
 * button does.
 */
function Closable({ name = '' }: { name?: string }) {
    const [opened, setOpened] = useState(true)
    useCloseOnBack(opened, () => setOpened(false))

    return opened ? <button onClick={() => setOpened(false)}>Close{name}</button> : <p>Closed{name}</p>
}

// Numbers each test's starting history entry, so every test starts on an entry it knows
let lastStartEntry = 0

/**
 * Start the test on a history entry of its own. Going back once too often then lands on this entry, which the test
 * can tell apart from any other, instead of leaving the test's page altogether.
 * @returns The entry's state, to compare with after going back
 */
const pushStartEntry = () => {
    const state = { start: ++lastStartEntry }
    history.pushState(state, '')
    return state
}

/**
 * Go back one entry, as the back gesture or button does, and wait for the browser to finish, since going back
 * happens after the call returns. The current entry has to be the hook's, so a missing one fails the test here
 * rather than going back past it.
 */
const goBack = async () => {
    expect(history.state).toMatchObject({ closeOnBackEntry: expect.any(Number) })
    const wentBack = new Promise((resolve) => window.addEventListener('popstate', resolve, { once: true }))
    history.back()
    await wentBack
}

describe('useCloseOnBack', () => {
    test('should close on going back', async () => {
        pushStartEntry()
        render(<Closable />)

        await goBack()

        expect(await screen.findByText('Closed')).toBeInTheDocument()
    })

    // As with a price's modal over a product's details: going back closes the one on top, as Escape does
    test('should close only the newest of two open at once on going back', async () => {
        pushStartEntry()
        // The first opens first, as the details open before a modal from inside them
        render(
            <>
                <Closable name=" first" />
                <Closable name=" second" />
            </>
        )

        await goBack()

        expect(await screen.findByText('Closed second')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Close first' })).toBeInTheDocument()

        await goBack()

        expect(await screen.findByText('Closed first')).toBeInTheDocument()
    })

    // Going back left an entry of its own, rather than one the page had before it opened
    test('should stay on the same page when going back closes it', async () => {
        const address = location.href
        const startEntry = pushStartEntry()
        render(<Closable />)

        await goBack()
        // Long enough for a second, unwanted going back to finish
        await new Promise((resolve) => setTimeout(resolve, 100))

        expect(history.state).toEqual(startEntry)
        expect(location.href).toBe(address)
    })

    // Otherwise a later back would only remove the leftover entry, and seem to do nothing
    test('should remove its history entry when closed another way', async () => {
        const user = userEvent.setup()
        const startEntry = pushStartEntry()
        render(<Closable />)
        expect(history.state).toMatchObject({ closeOnBackEntry: expect.any(Number) })

        await user.click(screen.getByRole('button', { name: 'Close' }))

        await expect.poll(() => history.state).toEqual(startEntry)
    })

    // Such as a product deleted from its own details, whose row and details both leave the page
    test('should remove its history entry when it leaves the page while open', async () => {
        const startEntry = pushStartEntry()
        const { unmount } = render(<Closable />)
        expect(history.state).toMatchObject({ closeOnBackEntry: expect.any(Number) })

        unmount()

        await expect.poll(() => history.state).toEqual(startEntry)
    })

    // An entry added while it was open belongs to someone else, so closing doesn't go back over it
    test('should leave a newer history entry alone when closed', async () => {
        const user = userEvent.setup()
        pushStartEntry()
        render(<Closable />)
        history.pushState({ newer: true }, '')

        await user.click(screen.getByRole('button', { name: 'Close' }))
        // Going back would happen after the click, so give it the time it would take before checking
        await new Promise((resolve) => setTimeout(resolve, 100))

        expect(history.state).toEqual({ newer: true })
    })

    // The first entry's removal lands after the second opens, which must neither close the second nor leave its
    // entry ahead of the current one, where going back couldn't reach it
    test('should keep open what opens right after another closes, with its own entry current', async () => {
        const startEntry = pushStartEntry()
        const first = render(<Closable name=" first" />)
        const firstEntryId = history.state.closeOnBackEntry

        // Both finish their effects straight away, before the browser has gone back to remove the first entry
        first.unmount()
        render(<Closable name=" second" />)
        // Long enough for the first entry's removal to land
        await new Promise((resolve) => setTimeout(resolve, 200))

        expect(screen.getByRole('button', { name: 'Close second' })).toBeInTheDocument()
        expect(history.state.closeOnBackEntry).toBeGreaterThan(firstEntryId)
        await goBack()
        expect(await screen.findByText('Closed second')).toBeInTheDocument()
        expect(history.state).toEqual(startEntry)
    })

    test('should add no history entry while closed', async () => {
        const startEntry = pushStartEntry()

        /** Something that stays closed. */
        function StaysClosed() {
            useCloseOnBack(false, () => {})
            return null
        }
        render(<StaysClosed />)

        expect(history.state).toEqual(startEntry)
    })
})
