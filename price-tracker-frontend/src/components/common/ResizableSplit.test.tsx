import { afterEach, beforeEach, describe, expect } from 'vitest'
import { page } from 'vitest/browser'
import { fireEvent, renderWithClient, screen, test, userEvent, within } from '@/test-utils'
import { ResizableSplit } from './ResizableSplit'
import '@/styles/index.css'

const storageKey = 'resizable-split-test'
const splitWidth = 1000
const minStartWidth = 300
const minEndWidth = 200

// A split of the given width with plain panes, so their widths can be measured
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

// The divider and the two panes of the split with the given test ID
const getSplit = (testId = 'split') => {
    const split = within(screen.getByTestId(testId))
    const separator = split.getByRole('separator')
    return {
        separator,
        startPane: split.getByText('Start pane').parentElement!,
        endPane: split.getByText('End pane').parentElement!
    }
}

// The split measures itself after it first renders, and until then its limits are 0 and 100%. Waits for either
// limit to change, so a test of one limit doesn't depend on the other.
const waitForMeasuredSplit = async (testId = 'split') => {
    const { separator } = getSplit(testId)
    await expect
        .poll(
            () => separator.getAttribute('aria-valuemin') !== '0' || separator.getAttribute('aria-valuemax') !== '100'
        )
        .toBe(true)
    return getSplit(testId)
}

// Presses the divider, moves the pointer to the given distance from the split's left edge, and lets go
const dragDivider = (separator: HTMLElement, startPane: HTMLElement, toX: number) => {
    const left = startPane.getBoundingClientRect().left
    fireEvent.pointerDown(separator, { pointerId: 1, button: 0, clientX: left + startPane.offsetWidth })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: left + toX })
    fireEvent.pointerUp(window, { pointerId: 1, clientX: left + toX })
}

describe('ResizableSplit', () => {
    // Below 1024 px wide the root font drops to 16 px, and the default viewport is narrower than the split
    let defaultViewport = { width: 0, height: 0 }
    beforeEach(async () => {
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

        expect(startPane.offsetWidth).toBe(700)
    })

    test('should give the end pane the rest of the width beside the divider', async () => {
        renderSplit()
        const { separator, startPane, endPane } = await waitForMeasuredSplit()

        expect(startPane.offsetWidth + separator.offsetWidth + endPane.offsetWidth).toBe(splitWidth)
    })

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

        expect(separator).toHaveAttribute('aria-valuenow', '70')
        expect(separator).toHaveAttribute('aria-valuemin', '30')
        expect(separator).toHaveAttribute('aria-valuemax', '80')
    })

    test('should resize both panes when the divider is dragged', async () => {
        renderSplit()
        const { separator, startPane, endPane } = await waitForMeasuredSplit()

        dragDivider(separator, startPane, 500)

        await expect.poll(() => startPane.offsetWidth).toBe(500)
        expect(endPane.offsetWidth).toBe(splitWidth - 500 - separator.offsetWidth)
        expect(separator).toHaveAttribute('aria-valuenow', '50')
    })

    test('should stop at the start pane minimum width', async () => {
        renderSplit()
        const { separator, startPane } = await waitForMeasuredSplit()

        dragDivider(separator, startPane, 50)

        await expect.poll(() => startPane.offsetWidth).toBe(minStartWidth)
    })

    test('should stop at the end pane minimum width', async () => {
        renderSplit()
        const { separator, startPane, endPane } = await waitForMeasuredSplit()

        dragDivider(separator, startPane, 950)

        await expect.poll(() => endPane.offsetWidth).toBe(minEndWidth)
    })

    test('should stop resizing once the divider is let go', async () => {
        renderSplit()
        const { separator, startPane } = await waitForMeasuredSplit()
        dragDivider(separator, startPane, 500)
        await expect.poll(() => startPane.offsetWidth).toBe(500)

        fireEvent.pointerMove(window, { pointerId: 1, clientX: startPane.getBoundingClientRect().left + 600 })

        expect(startPane.offsetWidth).toBe(500)
    })

    test('should not resize when the pointer moves without pressing the divider', async () => {
        renderSplit()
        const { startPane } = await waitForMeasuredSplit()

        fireEvent.pointerMove(window, { pointerId: 1, clientX: startPane.getBoundingClientRect().left + 500 })

        expect(startPane.offsetWidth).toBe(700)
    })

    test('should move the divider 5% with the arrow keys', async () => {
        const user = userEvent.setup()
        renderSplit()
        const { separator, startPane } = await waitForMeasuredSplit()
        separator.focus()

        await user.keyboard('{ArrowLeft}{ArrowLeft}')
        expect(startPane.offsetWidth).toBe(600)

        await user.keyboard('{ArrowRight}')
        expect(startPane.offsetWidth).toBe(650)
    })

    test('should not move the divider past a limit with the arrow keys', async () => {
        const user = userEvent.setup()
        renderSplit()
        const { separator, endPane } = await waitForMeasuredSplit()
        separator.focus()

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
        const user = userEvent.setup()
        renderSplit()
        const { separator, startPane } = await waitForMeasuredSplit()
        dragDivider(separator, startPane, 500)
        await expect.poll(() => startPane.offsetWidth).toBe(500)

        await user.dblClick(separator)

        expect(startPane.offsetWidth).toBe(700)
    })

    test('should remember the split after it is closed and opened again', async () => {
        const { unmount } = renderSplit()
        const { separator, startPane } = await waitForMeasuredSplit()
        dragDivider(separator, startPane, 500)
        await expect.poll(() => startPane.offsetWidth).toBe(500)
        unmount()

        renderSplit()

        expect(getSplit().startPane.offsetWidth).toBe(500)
    })

    test('should resize every split that shares the remembered split', async () => {
        renderSplit(splitWidth, 'first')
        renderSplit(splitWidth, 'second')
        const first = await waitForMeasuredSplit('first')
        const second = await waitForMeasuredSplit('second')

        dragDivider(first.separator, first.startPane, 500)

        await expect.poll(() => second.startPane.offsetWidth).toBe(500)
    })

    test('should use the default split when the remembered one is not a share', async () => {
        localStorage.setItem(storageKey, '"wide"')
        renderSplit()

        const { startPane } = await waitForMeasuredSplit()

        expect(startPane.offsetWidth).toBe(700)
    })

    test('should keep the share and drop the minimums when the split is too narrow for both', async () => {
        renderSplit()
        const { separator, startPane } = await waitForMeasuredSplit()

        screen.getByTestId('split').style.width = '400px'

        await expect.poll(() => separator.getAttribute('aria-valuemin')).toBe('0')
        expect(separator).toHaveAttribute('aria-valuemax', '100')
        expect(startPane.offsetWidth).toBe(280)
    })
})
