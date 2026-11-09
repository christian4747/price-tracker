import { useElementSize, useLocalStorage } from '@mantine/hooks'
import { useEffect, useId, useRef, useState } from 'react'

interface ResizableSplit {
    start: React.ReactNode
    end: React.ReactNode
    // Names the divider for screen readers, such as "Resize chart and price list"
    separatorLabel: string
    // The start pane's share of the width when nothing is remembered, from 0 to 1
    defaultShare: number
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

// Two panes side by side, with a divider between them that can be dragged or moved with the keyboard. The split is
// measured with its border, so put any border or padding on a wrapper around it.
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

    // The minimums give way when the split is too narrow for both, or not measured yet
    const fitsBoth = width >= minStartWidth + DIVIDER_WIDTH + minEndWidth
    const minShare = fitsBoth ? minStartWidth / width : 0
    const maxShare = fitsBoth ? (width - DIVIDER_WIDTH - minEndWidth) / width : 1
    const clampShare = (share: number) => Math.min(maxShare, Math.max(minShare, share))
    const share = clampShare(dragShare ?? savedShare)

    // A drag still going when the split goes away stops with it
    useEffect(() => () => stopDragRef.current?.(), [])

    const startDrag = (event: React.PointerEvent) => {
        if (event.button !== 0 || width === 0) return
        // Stops the drag from selecting text
        event.preventDefault()
        let latestShare = share

        // Listens on the window, so the drag keeps going over the panes and their tooltips
        const move = (moveEvent: PointerEvent) => {
            const left = startPaneRef.current!.getBoundingClientRect().left
            latestShare = clampShare((moveEvent.clientX - left) / width)
            setDragShare(latestShare)
        }
        const stop = () => {
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', finish)
            window.removeEventListener('pointercancel', finish)
            document.body.style.removeProperty('cursor')
            stopDragRef.current = null
        }
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
        stopDragRef.current = stop
        setDragShare(latestShare)
    }

    const moveWithKeyboard = (event: React.KeyboardEvent) => {
        const nextShare = {
            ArrowLeft: share - KEYBOARD_STEP,
            ArrowRight: share + KEYBOARD_STEP,
            Home: minShare,
            End: maxShare
        }[event.key]
        if (nextShare === undefined) return

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
