import { afterEach, beforeEach, describe, expect, vi } from 'vitest'
import { page, userEvent as pointer } from 'vitest/browser'
import { createPrice, renderWithClient, screen, test } from '@/test-utils'
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

const renderChart = (prices: PriceType[], averagePrice: number | null = null, currency: string = 'USD') =>
    renderWithClient(
        <div style={{ width: 1000, display: 'flex' }}>
            <PriceHistoryChart
                prices={prices}
                dateToday={new Date(2026, 10, 9, 12)}
                timeRange="oneYear"
                setTimeRange={() => {}}
                averagePrice={averagePrice}
                currency={currency}
            />
        </div>
    )

// Below 1024 px wide the root font drops to 16 px, so use a desktop width to get desktop sizes
const useDesktopViewport = () => {
    let defaultViewport = { width: 0, height: 0 }
    beforeEach(async () => {
        defaultViewport = { width: window.innerWidth, height: window.innerHeight }
        await page.viewport(1280, 900)
    })
    afterEach(async () => {
        await page.viewport(defaultViewport.width, defaultViewport.height)
    })
}

// The price line's top edge, once the chart has drawn it
const getLineTop = async (container: HTMLElement) => {
    await expect.poll(() => container.querySelector('.recharts-line-curve')).toBeTruthy()
    return container.querySelector('.recharts-line-curve')!.getBoundingClientRect().top
}

// The chart's horizontal reference lines, which only the average draws (the Now line is vertical)
const getHorizontalLines = (container: HTMLElement) =>
    [...container.querySelectorAll('.recharts-reference-line line')].filter(
        (line) => line.getAttribute('y1') === line.getAttribute('y2')
    )

describe('Price History Chart Average', () => {
    useDesktopViewport()

    test('should draw the average line at the height of a price with the same amount', async () => {
        const { container } = renderChart(createRisingPrices([10, 20, 30]), 20)
        await getLineTop(container)

        const [averageLine] = getHorizontalLines(container)
        // Oldest first on the chart, so the second dot is the price of 20
        const dotAtAverage = container.querySelectorAll('.recharts-line-dots circle')[1]

        expect(Number(averageLine.getAttribute('y1'))).toBeCloseTo(Number(dotAtAverage.getAttribute('cy')), 0)
    })

    test('should show a legend with the average in the product currency', async () => {
        const { container } = renderChart(createRisingPrices([10, 20, 30]), 20, 'EUR')
        await getLineTop(container)

        expect(screen.getByText('Average €20.00')).toBeInTheDocument()
    })

    // At the highest price, the price and average lines are as close to the top as they get
    test('should put the legend in the top-left corner, above the price and average lines', async () => {
        const { container } = renderChart(createRisingPrices([10, 20, 30]), 30)
        const priceLineTop = await getLineTop(container)

        const averageLine = getHorizontalLines(container)[0].getBoundingClientRect()
        const legend = screen.getByText('Average $30.00').getBoundingClientRect()

        expect(legend.right).toBeLessThan(averageLine.left + averageLine.width / 2)
        expect(legend.bottom).toBeLessThan(priceLineTop)
        expect(legend.bottom).toBeLessThan(averageLine.top)
    })

    test('should not draw a line or legend without an average', async () => {
        const { container } = renderChart(createRisingPrices([10, 20, 30]))
        await getLineTop(container)

        expect(getHorizontalLines(container)).toHaveLength(0)
        expect(screen.queryByText(/^Average/)).not.toBeInTheDocument()
    })

    // A shorter time range can leave the whole history's average above every price in view
    test('should keep an average above every price inside the chart and below the time range control', async () => {
        const { container } = renderChart(createRisingPrices([10, 20]), 100)
        await getLineTop(container)
        const control = screen.getByRole('radiogroup', { name: 'Time range' })

        const averageTop = getHorizontalLines(container)[0].getBoundingClientRect().top

        expect(averageTop).toBeGreaterThan(control.getBoundingClientRect().bottom)
        expect(screen.getByText('Average $100.00')).toBeVisible()
    })

    test('should keep the legend clear of the time range control', async () => {
        const { container } = renderChart(createRisingPrices([10, 20, 30]), 30)
        await getLineTop(container)

        const label = screen.getByText('Average $30.00').getBoundingClientRect()
        const control = screen.getByRole('radiogroup', { name: 'Time range' }).getBoundingClientRect()
        const overlaps =
            label.left < control.right &&
            control.left < label.right &&
            label.top < control.bottom &&
            control.top < label.bottom

        expect(overlaps).toBe(false)
    })
})

describe('Price History Chart Layout', () => {
    useDesktopViewport()

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

        const chart = container.querySelector('.recharts-wrapper') as HTMLElement
        const { width, height } = chart.getBoundingClientRect()
        await pointer.hover(chart, { position: { x: width - 20, y: height - 40 } })
        const tooltip = await vi.waitUntil(() =>
            container.querySelector('.recharts-tooltip-wrapper .mantine-Paper-root')
        )

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
})
