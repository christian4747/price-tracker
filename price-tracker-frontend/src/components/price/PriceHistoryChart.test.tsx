import { afterEach, beforeEach, describe, expect, vi } from 'vitest'
import { page, userEvent as pointer } from 'vitest/browser'
import { createPrice, renderWithClient, screen, test, within } from '@/test-utils'
import type { PriceType } from '@/types/price'
import PriceHistoryChart from './PriceHistoryChart'
import '@/styles/index.css'

// Newest first, like the API. The price rises to its highest and stays there until now, so the line runs along the top
// of the chart and under the time range control in its corner.
const createRisingPrices = (amounts: number[]): PriceType[] => {
    const prices = amounts.map((totalAmount, index) =>
        createPrice(index + 1, { totalAmount, priceStarted: new Date(2026, 8, index + 1, 12).toISOString() })
    )
    const today = { ...prices[prices.length - 1], today: true }
    return [today, ...prices.toReversed()]
}

const renderChart = (prices: PriceType[]) =>
    renderWithClient(
        <div data-testid="chart-wrapper" style={{ width: 1000, display: 'flex' }}>
            <PriceHistoryChart
                prices={prices}
                dateToday={new Date(2026, 10, 9, 12)}
                timeRange="oneYear"
                setTimeRange={() => {}}
            />
        </div>
    )

// Hovers low near the chart's right edge and waits for the tooltip there. The mouse stays where the last test left
// it, so it starts from the opposite corner to make sure it moves. It hovers the wrapper, found by its test ID,
// since the chart itself is only found by its text, which a tooltip changes.
const showTooltip = async (container: HTMLElement) => {
    const wrapper = screen.getByTestId('chart-wrapper')
    const chart = container.querySelector('.recharts-wrapper')!.getBoundingClientRect()
    const offset = wrapper.getBoundingClientRect()
    const left = chart.left - offset.left
    const top = chart.top - offset.top
    await pointer.hover(wrapper, { position: { x: left + 20, y: top + 20 } })
    await pointer.hover(wrapper, { position: { x: left + chart.width - 20, y: top + chart.height - 40 } })
    return (await vi.waitUntil(() =>
        container.querySelector('.recharts-tooltip-wrapper .mantine-Paper-root')
    )) as HTMLElement
}

describe('Price History Chart Layout', () => {
    // Below 1024 px wide the root font drops to 16 px, so use a desktop width to get desktop sizes
    let defaultViewport = { width: 0, height: 0 }
    beforeEach(async () => {
        defaultViewport = { width: window.innerWidth, height: window.innerHeight }
        await page.viewport(1280, 900)
    })
    afterEach(async () => {
        await page.viewport(defaultViewport.width, defaultViewport.height)
    })

    // The line's top edge, once the chart has drawn it
    const getLineTop = async (container: HTMLElement) => {
        await expect.poll(() => container.querySelector('.recharts-line-curve')).toBeTruthy()
        return container.querySelector('.recharts-line-curve')!.getBoundingClientRect().top
    }

    test.each([
        ['prices that change', [10, 15, 20]],
        ['a price that never changes', [20, 20]],
        ['a price of zero', [0, 0]]
    ])('should keep the line below the time range control with %s', async (_, amounts) => {
        const { container } = renderChart(createRisingPrices(amounts))
        const control = screen.getByRole('radiogroup', { name: 'Time range' })

        expect(await getLineTop(container)).toBeGreaterThan(control.getBoundingClientRect().bottom)
    })

    // A long description makes the tooltip tall, so hovering low near the right edge moves it up into the corner
    test('should show the tooltip above the time range control', async () => {
        const description = 'A long description that wraps onto many lines in the tooltip. '.repeat(6)
        const prices = createRisingPrices([10, 15, 20]).map((price) => ({ ...price, description }))
        const { container } = renderChart(prices)
        const control = screen.getByRole('radiogroup', { name: 'Time range' })
        await getLineTop(container)

        const tooltip = await showTooltip(container)

        // The middle of where the tooltip and control overlap, which shows whichever is drawn on top
        const tooltipBox = tooltip.getBoundingClientRect()
        const controlBox = control.getBoundingClientRect()
        const overlap = {
            left: Math.max(tooltipBox.left, controlBox.left),
            right: Math.min(tooltipBox.right, controlBox.right),
            top: Math.max(tooltipBox.top, controlBox.top),
            bottom: Math.min(tooltipBox.bottom, controlBox.bottom)
        }
        expect(overlap.right).toBeGreaterThan(overlap.left)
        expect(overlap.bottom).toBeGreaterThan(overlap.top)

        // The chart turns off pointer events on its tooltip, which elementFromPoint skips. Turning them back on
        // doesn't change which is drawn on top.
        const tooltipWrapper = tooltip.closest('.recharts-tooltip-wrapper') as HTMLElement
        tooltipWrapper.style.pointerEvents = 'auto'
        const shown = document.elementFromPoint((overlap.left + overlap.right) / 2, (overlap.top + overlap.bottom) / 2)
        expect(tooltip.contains(shown)).toBe(true)
    })

    test("should keep a price's description in its own paragraph in the tooltip", async () => {
        const prices = createRisingPrices([10, 15, 20]).map((price) => ({ ...price, description: 'Holiday sale' }))
        const { container } = renderChart(prices)
        await getLineTop(container)

        const tooltip = await showTooltip(container)

        expect(within(tooltip).getByText('Holiday sale')).toBeInTheDocument()
        expect(tooltip.querySelector('p p')).toBeNull()
    })
})
