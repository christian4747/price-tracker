import { useElementSize, useLocalStorage } from '@mantine/hooks'
import { useEffect, useId, useRef, useState } from 'react'

interface ResizableSplit {
    start: React.ReactNode
    end: React.ReactNode
    // Names the divider for screen readers, such as "Resize chart and price list"
    separatorLabel: string
    // The start pane's share of the width when nothing is remembered, from 0 to 1
    defaultShare: number
    // The narrowest each pane can be dragged to, in pixels
    minStartWidth: number
    minEndWidth: number
    // Where the split is remembered; every split with the same key shares it
    storageKey: string
    className?: string
    startClassName?: string
    endClassName?: string
}

// How far each arrow key moves the divider, as a share of the width
const KEYBOARD_STEP = 0.05

// The divider's line takes this much of the width; its grab area spreads over the panes beside it
const DIVIDER_WIDTH = 1

// The divider shows 3 px wide in the chart's blue while it's dragged, hovered, or focused, without changing its
// width in the layout
const HIGHLIGHT_CLASS = 'bg-(--mantine-color-blue-6) shadow-[0_0_0_1px_var(--mantine-color-blue-6)]'
const HOVER_HIGHLIGHT_CLASS =
    'hover:bg-(--mantine-color-blue-6) hover:shadow-[0_0_0_1px_var(--mantine-color-blue-6)] ' +
    'focus-visible:bg-(--mantine-color-blue-6) focus-visible:shadow-[0_0_0_1px_var(--mantine-color-blue-6)]'

/**
 * Two panes side by side, with a divider between them that can be dragged, moved with the keyboard, or double-clicked
 * to reset. The start pane's share of the width is remembered in local storage. The split is measured with its border,
 * so put any border or padding on a wrapper around it.
 */
export const ResizableSplit = ({
    start,
    end,
    separatorLabel,
    defaultShare,
    minStartWidth,
    minEndWidth,
    storageKey,
    className = '',
    startClassName = '',
    endClassName = ''
}: ResizableSplit) => {
    const startPaneId = useId()
    const startPaneRef = useRef<HTMLDivElement>(null)
    const { ref: splitRef, width } = useElementSize<HTMLDivElement>()
    // Read before the first render, so a remembered split doesn't jump from the default
    const [savedShare, setSavedShare] = useLocalStorage<number>({
        key: storageKey,
        defaultValue: defaultShare,
        getInitialValueInEffect: false,
        deserialize: (value) => {
            const share = Number(value)
            return share > 0 && share < 1 ? share : defaultShare
        }
    })
    // While the divider is dragged, the share is kept here and only saved when it's let go
    const [dragShare, setDragShare] = useState<number | null>(null)
    const stopDragRef = useRef<(() => void) | null>(null)

    // The minimums give way when the split is too narrow for both, or not measured yet (a width of 0)
    const fitsBoth = width >= minStartWidth + DIVIDER_WIDTH + minEndWidth
    // The smallest share leaves the start pane at its minimum width, and the largest leaves the end pane at its own,
    // after the divider takes its pixel
    const minShare = fitsBoth ? minStartWidth / width : 0
    const maxShare = fitsBoth ? (width - DIVIDER_WIDTH - minEndWidth) / width : 1

    /**
     * Keep a share between the smallest and largest the panes allow.
     * @param share A share of the width, from 0 to 1
     * @returns The share, moved to the nearest allowed one when it's outside them
     */
    const clampShare = (share: number) => Math.min(maxShare, Math.max(minShare, share))

    // A drag's share wins over the saved one while it lasts. The saved share is clamped too, since one remembered
    // from a wider window can be too large for this one.
    const share = clampShare(dragShare ?? savedShare)

    // A drag still going when the split goes away stops with it, so its window listeners don't outlive the split
    useEffect(() => () => stopDragRef.current?.(), [])

    /**
     * Start dragging the divider. The share follows the pointer until it's let go, and is saved only then, so local
     * storage isn't written on every move.
     * @param event The pointer press on the divider
     */
    const startDrag = (event: React.PointerEvent) => {
        // Only the main button drags, and nothing can be dragged before the split has been measured
        if (event.button !== 0 || width === 0) return
        // Stops the drag from selecting text
        event.preventDefault()
        // Kept outside React's state, so finish can save the last share without waiting for a render
        let latestShare = share

        /**
         * Move the divider to the pointer. Listens on the window, so the drag keeps going over the panes and their
         * tooltips.
         * @param moveEvent The pointer's move anywhere on the page
         */
        const move = (moveEvent: PointerEvent) => {
            // The divider sits at the start pane's right edge, so the pointer's distance from the pane's left edge is
            // the start pane's new width
            const left = startPaneRef.current!.getBoundingClientRect().left
            latestShare = clampShare((moveEvent.clientX - left) / width)
            setDragShare(latestShare)
        }
        /**
         * Remove the drag's listeners and cursor without saving anything. Used on its own when the split goes away
         * mid-drag, where there's nothing left to save into.
         */
        const stop = () => {
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', finish)
            window.removeEventListener('pointercancel', finish)
            document.body.style.removeProperty('cursor')
            stopDragRef.current = null
        }
        /**
         * End the drag when the pointer is let go or the browser cancels it, and save where the divider ended up.
         */
        const finish = () => {
            stop()
            setSavedShare(latestShare)
            setDragShare(null)
        }

        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', finish)
        window.addEventListener('pointercancel', finish)
        // Keeps the resize cursor while the pointer is over the panes
        document.body.style.cursor = 'col-resize'
        // Lets the unmount cleanup above stop this drag
        stopDragRef.current = stop
        // Shows the drag's highlight straight away, before the pointer moves
        setDragShare(latestShare)
    }

    /**
     * Move the divider with the keyboard: the arrow keys by a step, and Home and End to either pane's minimum. Each move
     * is saved straight away, since a key press is a finished move.
     * @param event The key press on the focused divider
     */
    const moveWithKeyboard = (event: React.KeyboardEvent) => {
        const nextShare = {
            ArrowLeft: share - KEYBOARD_STEP,
            ArrowRight: share + KEYBOARD_STEP,
            Home: minShare,
            End: maxShare
        }[event.key]
        // Any other key keeps its usual behavior, such as Tab moving focus
        if (nextShare === undefined) return

        // Stops the arrow keys and Home and End from also scrolling the page
        event.preventDefault()
        setSavedShare(clampShare(nextShare))
    }

    const dragging = dragShare !== null

    return (
        <div ref={splitRef} className={`flex ${className}`}>
            <div
                id={startPaneId}
                ref={startPaneRef}
                className={`flex-none min-w-0 ${startClassName}`}
                style={{ width: `${share * 100}%` }}
            >
                {start}
            </div>
            {/* A thin line with a wider invisible grab area (before:), highlighted with a grip while it's hovered,
                focused, or dragged */}
            <div
                role="separator"
                aria-orientation="vertical"
                aria-label={separatorLabel}
                aria-controls={startPaneId}
                aria-valuenow={Math.round(share * 100)}
                aria-valuemin={Math.round(minShare * 100)}
                aria-valuemax={Math.round(maxShare * 100)}
                tabIndex={0}
                onPointerDown={startDrag}
                onKeyDown={moveWithKeyboard}
                onDoubleClick={() => setSavedShare(defaultShare)}
                className={`group relative z-10 flex-none cursor-col-resize touch-none outline-none before:absolute before:inset-y-0 before:-inset-x-1.5 before:content-[''] ${dragging ? HIGHLIGHT_CLASS : `bg-smoke ${HOVER_HIGHLIGHT_CLASS}`}`}
                style={{ width: DIVIDER_WIDTH }}
            >
                <span
                    aria-hidden="true"
                    className={`absolute top-1/2 left-1/2 -translate-1/2 h-8 w-2 rounded-full bg-white border border-(--mantine-color-blue-6) opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 ${dragging ? 'opacity-100' : ''}`}
                />
            </div>
            <div className={`flex-1 min-w-0 ${endClassName}`}>{end}</div>
        </div>
    )
}
