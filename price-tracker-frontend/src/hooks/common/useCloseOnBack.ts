import { useEffect, useEffectEvent } from 'react'

// Numbers each history entry the hook adds, so it only ever removes its own. A counter rather than a random ID, since
// crypto.randomUUID only works on secure pages, and the app is also opened over plain http on the local network.
let lastEntryId = 0

// What's open now, by the number of its history entry, with how to close it
const openEntries = new Map<number, () => void>()

// How many times the hook has gone back to remove an entry of its own, without the browser having done it yet. Going
// back finishes a moment after history.back() returns, with a popstate event like the user's own.
let pendingBacks = 0

// Entries waiting to be added until those backs finish. Added sooner, a back that's still on its way would land on
// the new entry's predecessor and look like the user going back from the new one.
const waitingPushes = new Map<number, () => void>()

/**
 * Handle every going back in one place, so each one is either the hook's own removal of an entry, or the user's.
 * The user's closes everything opened after the entry it lands on, which is the newest when several are open at once.
 */
const handlePopState = () => {
    if (pendingBacks > 0) {
        pendingBacks--
        // The last of the hook's own backs is done, so entries opened meanwhile can be added now, in order
        if (pendingBacks === 0) {
            for (const push of waitingPushes.values()) push()
            waitingPushes.clear()
        }
        return
    }

    const currentEntryId = history.state?.closeOnBackEntry
    for (const [entryId, close] of openEntries) {
        if (typeof currentEntryId === 'number' && currentEntryId >= entryId) continue
        openEntries.delete(entryId)
        close()
    }
}
window.addEventListener('popstate', handlePopState)

/**
 * Close something, such as a modal, when the browser goes back, instead of leaving the page. On a phone the back
 * gesture is how people close what fills the screen. While it's open, the page gets a history entry of its own at the
 * same address, which going back removes. Closed any other way, the entry is removed too, so a later back still
 * leaves the page as it would have. With several open at once, such as a price's modal over a product's details, going
 * back closes only the newest, as Escape does.
 * @param opened Whether it's open
 * @param onClose Closes it
 */
export const useCloseOnBack = (opened: boolean, onClose: () => void) => {
    // The latest onClose, without reopening the entry each time the caller passes a new function
    const close = useEffectEvent(onClose)

    useEffect(() => {
        if (!opened) return

        const entryId = ++lastEntryId
        openEntries.set(entryId, () => close())

        /**
         * Add the entry, kept with whatever state the current entry has, and at the same address, so nothing else
         * about the page changes.
         */
        const push = () => history.pushState({ ...history.state, closeOnBackEntry: entryId }, '')
        if (pendingBacks > 0) waitingPushes.set(entryId, push)
        else push()

        return () => {
            openEntries.delete(entryId)
            // Never added, so there's nothing to remove
            if (waitingPushes.delete(entryId)) return
            // Closed another way, or no longer on the page: remove the entry, but only while it's still the current
            // one. After going back it isn't, so closing doesn't go back twice, and an entry added after it is left
            // alone.
            if (history.state?.closeOnBackEntry === entryId) {
                pendingBacks++
                history.back()
            }
        }
    }, [opened])
}
