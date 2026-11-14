import { afterEach, beforeEach, describe, expect, onTestFinished } from 'vitest'
import { page, userEvent as pointer } from 'vitest/browser'
import { renderWithClient, screen, test, userEvent, within } from '@/test-utils'
import { ResizableSplit } from './ResizableSplit'
import '@/styles/index.css'

const storageKey = 'resizable-split-test'
// 1000 px, so each pixel is a tenth of a percent and expected widths are easy to work out
const splitWidth = 1000
// With these, the start pane's share can go from 30% (300 px) to 80% (1000 - 1 px divider - 200 px, rounded)
const minStartWidth = 300
const minEndWidth = 200

/**
 * Render a split with plain text panes, so their widths can be measured. It starts at a share of 70%.
 * @param width The split's width in pixels
 * @param testId The test ID on the split's wrapper, so a test with two splits can tell them apart
 * @returns The render result, for unmounting
 */
const renderSplit = (width = splitWidth, testId = 'split') =>
    renderWithClient(
        <div data-testid={testId} style={{ width }}>
            <ResizableSplit
                start={<div>Start pane</div>}
                end={<div>End pane</div>}
                separatorLabel="Resize the panes"
                defaultShare={0.7}
                minStartWidth={minStartWidth}
                minEndWidth={minEndWidth}
                storageKey={storageKey}
            />
        </div>
    )

/**
 * Find the divider and the two panes of a split.
 * @param testId The test ID on the split's wrapper
 * @returns The divider, and the start and end panes (the elements whose widths the split sets)
 */
const getSplit = (testId = 'split') => {
    const split = within(screen.getByTestId(testId))
    const separator = split.getByRole('separator')
    return {
        separator,
        startPane: split.getByText('Start pane').parentElement!,
        endPane: split.getByText('End pane').parentElement!
    }
}

/**
 * Wait for a split to measure its own width, which it does after it first renders. Until then its limits are 0 and
 * 100%, so a drag or key press would ignore the minimums. Waits for either limit to change, so a test of one limit
 * doesn't depend on the other.
 * @param testId The test ID on the split's wrapper
 * @returns The split's divider and panes, as getSplit gives them
 */
const waitForMeasuredSplit = async (testId = 'split') => {
    const { separator } = getSplit(testId)
    await expect
        .poll(
            () => separator.getAttribute('aria-valuemin') !== '0' || separator.getAttribute('aria-valuemax') !== '100'
        )
        .toBe(true)
    return getSplit(testId)
}

/**
 * Drag the divider with the real mouse: press it, move to a point over the split, and let go. Fired events won't do,
 * since the divider captures the pointer, and a browser only lets a pointer that's really pressed be captured.
 * @param separator The divider to drag
 * @param toX Where to let go, as a distance in pixels from the split's left edge
 * @param testId The test ID on the split's wrapper, whose left edge is the split's
 */
const dragDivider = async (separator: HTMLElement, toX: number, testId = 'split') => {
    // A few pixels down, so the pointer stays over the panes' text
    await pointer.dragAndDrop(separator, screen.getByTestId(testId), { targetPosition: { x: toX, y: 5 } })
}

/**
 * Move the real mouse to a point over the split, without pressing anything.
 * @param x The distance in pixels from the split's left edge
 */
const movePointerOverSplit = async (x: number) => {
    await pointer.hover(screen.getByTestId('split'), { position: { x, y: 5 } })
}

describe('ResizableSplit', () => {
    // Below 1024 px wide the root font drops to 16 px, and the default viewport is narrower than the split
    let defaultViewport = { width: 0, height: 0 }
    beforeEach(async () => {
        // Each test starts with nothing remembered, so it begins at the default split
        localStorage.removeItem(storageKey)
        defaultViewport = { width: window.innerWidth, height: window.innerHeight }
        await page.viewport(1280, 900)
    })
    afterEach(async () => {
        localStorage.removeItem(storageKey)
        await page.viewport(defaultViewport.width, defaultViewport.height)
    })

    test('should start at the default split', async () => {
        renderSplit()
        const { startPane } = await waitForMeasuredSplit()

        // 70% of 1000 px
        expect(startPane.offsetWidth).toBe(700)
    })

    // The panes and the divider fill the split exactly, with no gap or overflow
    test('should give the end pane the rest of the width beside the divider', async () => {
        renderSplit()
        const { separator, startPane, endPane } = await waitForMeasuredSplit()

        expect(startPane.offsetWidth + separator.offsetWidth + endPane.offsetWidth).toBe(splitWidth)
    })

    // What a screen reader needs to announce the divider and move it
    test('should be a vertical separator that controls the start pane', async () => {
        renderSplit()
        const { separator, startPane } = await waitForMeasuredSplit()

        expect(separator).toHaveAccessibleName('Resize the panes')
        expect(separator).toHaveAttribute('aria-orientation', 'vertical')
        expect(separator).toHaveAttribute('aria-controls', startPane.id)
        expect(separator).toHaveAttribute('tabindex', '0')
    })

    test("should report the start pane's share and its limits in percent", async () => {
        renderSplit()
        const { separator } = await waitForMeasuredSplit()

        // The default share, and the limits the minimum widths allow (see minStartWidth and minEndWidth)
        expect(separator).toHaveAttribute('aria-valuenow', '70')
        expect(separator).toHaveAttribute('aria-valuemin', '30')
        expect(separator).toHaveAttribute('aria-valuemax', '80')
    })

    test('should resize both panes when the divider is dragged', async () => {
        renderSplit()
        const { separator, startPane, endPane } = await waitForMeasuredSplit()

        await dragDivider(separator, 500)

        // The start pane follows the pointer, and the end pane takes what's left
        await expect.poll(() => startPane.offsetWidth).toBe(500)
        expect(endPane.offsetWidth).toBe(splitWidth - 500 - separator.offsetWidth)
        expect(separator).toHaveAttribute('aria-valuenow', '50')
    })

    test('should stop at the start pane minimum width', async () => {
        renderSplit()
        const { separator, startPane } = await waitForMeasuredSplit()

        // Well past the 300 px minimum
        await dragDivider(separator, 50)

        await expect.poll(() => startPane.offsetWidth).toBe(minStartWidth)
    })

    test('should stop at the end pane minimum width', async () => {
        renderSplit()
        const { separator, endPane } = await waitForMeasuredSplit()

        // Would leave the end pane 49 px, well under its 200 px minimum
        await dragDivider(separator, 950)

        await expect.poll(() => endPane.offsetWidth).toBe(minEndWidth)
    })

    // A drag that kept listening would keep resizing as the pointer moves afterwards. Without a pressed pointer, only
    // moves over the divider's grab area (6 px each side) reach it, so the pointer moves within that.
    test('should stop resizing once the divider is let go', async () => {
        renderSplit()
        const { separator, startPane } = await waitForMeasuredSplit()
        await dragDivider(separator, 500)
        await expect.poll(() => startPane.offsetWidth).toBe(500)

        // The pointer keeps moving over the grab area after the drag let go
        await movePointerOverSplit(505)

        expect(startPane.offsetWidth).toBe(500)
    })

    // The chart shows its price tooltip and a hover line for moves it gets, which would follow the pointer through a
    // drag. Pressed moves are the only ones counted, since the pointer reaches the divider over the panes first.
    test('should keep the pointer moves of a drag from the panes', async () => {
        renderSplit()
        const { separator, startPane, endPane } = await waitForMeasuredSplit()
        const movesWhilePressed: string[] = []
        for (const [name, pane] of [
            ['start pane', startPane],
            ['end pane', endPane]
        ] as const) {
            // The chart listens for mouse events, which the browser fires along with pointer ones
            for (const type of ['pointermove', 'pointerover', 'mousemove', 'mouseover']) {
                pane.addEventListener(type, (event) => {
                    if ((event as PointerEvent).buttons !== 0) movesWhilePressed.push(`${type} on the ${name}`)
                })
            }
        }

        // Over the start pane, then over the end pane
        await dragDivider(separator, 500)
        await expect.poll(() => startPane.offsetWidth).toBe(500)
        await dragDivider(separator, 750)
        await expect.poll(() => startPane.offsetWidth).toBe(750)

        expect(movesWhilePressed).toEqual([])
    })

    // The panes' own cursors would otherwise show partway through a drag, such as the arrow the chart sets
    test('should show the resize cursor over the panes while the divider is dragged', async () => {
        renderSplit()
        const { separator } = await waitForMeasuredSplit()
        // Stand in for the chart's arrow and the price list's buttons, which set their own cursors
        const startText = screen.getByText('Start pane')
        const endText = screen.getByText('End pane')
        startText.style.cursor = 'default'
        endText.style.cursor = 'pointer'
        // Read partway through the drag, at each move while the pointer is pressed. Listened for on the window as the
        // move starts out, which comes before wherever the move goes.
        const cursorsWhilePressed: string[] = []
        const readCursors = (event: PointerEvent) => {
            if (event.buttons !== 0) {
                cursorsWhilePressed.push(getComputedStyle(startText).cursor, getComputedStyle(endText).cursor)
            }
        }
        window.addEventListener('pointermove', readCursors, { capture: true })
        onTestFinished(() => window.removeEventListener('pointermove', readCursors, { capture: true }))

        await dragDivider(separator, 500)

        // At least one move was read, and every read was the resize cursor
        expect(cursorsWhilePressed).not.toEqual([])
        expect(new Set(cursorsWhilePressed)).toEqual(new Set(['col-resize']))
    })

    test('should give the panes their own cursors back once the divider is let go', async () => {
        renderSplit()
        const { separator, startPane } = await waitForMeasuredSplit()
        // Stands in for the chart's arrow
        const startText = screen.getByText('Start pane')
        startText.style.cursor = 'default'

        await dragDivider(separator, 500)
        await expect.poll(() => startPane.offsetWidth).toBe(500)

        expect(getComputedStyle(startText).cursor).toBe('default')
    })

    // So the arrow keys can fine-tune a split straight after it's dragged
    test('should take focus when the divider is pressed', async () => {
        renderSplit()
        const { separator } = await waitForMeasuredSplit()

        // A real click, since a pressed divider stops the browser's own focusing, which fired events would skip
        await pointer.click(separator)

        expect(separator).toHaveFocus()
    })

    // Only a press on the divider starts a drag, so moving over it leaves the panes alone
    test('should not resize when the pointer moves without pressing the divider', async () => {
        renderSplit()
        const { startPane } = await waitForMeasuredSplit()

        // Within the grab area of the divider at 700 px, where a pressed pointer would move it
        await movePointerOverSplit(705)

        // Still the default 70%
        expect(startPane.offsetWidth).toBe(700)
    })

    test('should move the divider 5% with the arrow keys', async () => {
        const user = userEvent.setup()
        renderSplit()
        const { separator, startPane } = await waitForMeasuredSplit()
        separator.focus()

        // Two steps left from 70% is 60%
        await user.keyboard('{ArrowLeft}{ArrowLeft}')
        expect(startPane.offsetWidth).toBe(600)

        // One step back right is 65%
        await user.keyboard('{ArrowRight}')
        expect(startPane.offsetWidth).toBe(650)
    })

    test('should not move the divider past a limit with the arrow keys', async () => {
        const user = userEvent.setup()
        renderSplit()
        const { separator, endPane } = await waitForMeasuredSplit()
        separator.focus()

        // Three steps right from 70% would be 85%, past the 80% limit
        await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')

        expect(endPane.offsetWidth).toBe(minEndWidth)
    })

    test('should move the divider to the limits with Home and End', async () => {
        const user = userEvent.setup()
        renderSplit()
        const { separator, startPane, endPane } = await waitForMeasuredSplit()
        separator.focus()

        await user.keyboard('{Home}')
        expect(startPane.offsetWidth).toBe(minStartWidth)

        await user.keyboard('{End}')
        expect(endPane.offsetWidth).toBe(minEndWidth)
    })

    test('should go back to the default split when the divider is double-clicked', async () => {
        renderSplit()
        const { separator, startPane } = await waitForMeasuredSplit()
        await dragDivider(separator, 500)
        await expect.poll(() => startPane.offsetWidth).toBe(500)

        // A real double-click, since each of its presses captures the pointer
        await pointer.dblClick(separator)

        // Back to the default 70%
        await expect.poll(() => startPane.offsetWidth).toBe(700)
    })

    // Like closing a product's panel and opening it again
    test('should remember the split after it is closed and opened again', async () => {
        const { unmount } = renderSplit()
        const { separator, startPane } = await waitForMeasuredSplit()
        await dragDivider(separator, 500)
        await expect.poll(() => startPane.offsetWidth).toBe(500)
        unmount()

        renderSplit()

        // Checked straight away, not after waiting, since the remembered split is read before the first render and
        // shouldn't jump from the default
        expect(getSplit().startPane.offsetWidth).toBe(500)
    })

    // Like two products' panels open at once, which share one storage key
    test('should resize every split that shares the remembered split', async () => {
        renderSplit(splitWidth, 'first')
        renderSplit(splitWidth, 'second')
        const first = await waitForMeasuredSplit('first')
        const second = await waitForMeasuredSplit('second')

        await dragDivider(first.separator, 500, 'first')

        await expect.poll(() => second.startPane.offsetWidth).toBe(500)
    })

    // Local storage can hold anything, such as a value from an older version or one edited by hand
    test('should use the default split when the remembered one is not a share', async () => {
        // A JSON string, which isn't a number from 0 to 1
        localStorage.setItem(storageKey, '"wide"')
        renderSplit()

        const { startPane } = await waitForMeasuredSplit()

        expect(startPane.offsetWidth).toBe(700)
    })

    // At 400 px, the 300 px and 200 px minimums can't both fit, so the panes share the room rather than overflow
    test('should keep the share and drop the minimums when the split is too narrow for both', async () => {
        renderSplit()
        const { separator, startPane } = await waitForMeasuredSplit()

        // Narrowed after it was measured, like a window made smaller
        screen.getByTestId('split').style.width = '400px'

        await expect.poll(() => separator.getAttribute('aria-valuemin')).toBe('0')
        expect(separator).toHaveAttribute('aria-valuemax', '100')
        // Still 70%, now of 400 px
        expect(startPane.offsetWidth).toBe(280)
    })
})
