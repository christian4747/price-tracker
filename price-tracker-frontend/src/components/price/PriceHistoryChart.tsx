import { usePriceData } from '@/hooks/price/usePriceData'
import type { PriceTimeRange, PriceType } from '@/types/price'
import { getPriceChartScale, getPriceChartTickString } from '@/utils/priceChartScale'
import { PRICE_TIME_RANGE_OPTIONS } from '@/utils/priceTimeRange'
import { LineChart, type ChartTooltipProps } from '@mantine/charts'
import { Paper, SegmentedControl, Text } from '@mantine/core'

const getPriceWithCurrency = (amount: number, currency: string) => {
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency }).format(amount)
    } catch {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(amount)
    }
}

function ChartTooltip({ label, payload }: ChartTooltipProps) {
    if (!payload) return null

    return (
        <Paper px="md" py="sm" withBorder shadow="md">
            <Text fw={500} mb={5}>
                {label}
            </Text>
            {payload.map((item: any) => (
                // The price and description are separate paragraphs, one under the other, since a paragraph can't
                // hold another
                <div key={item.name}>
                    <Text c={item.color} fz="sm">
                        Price: {getPriceWithCurrency(item.value, item.payload.currency)}
                    </Text>
                    {item.payload.description && (
                        <Text fz="sm" className="text-raincloud max-w-75 wrap-break-word">
                            {item.payload.description}
                        </Text>
                    )}
                </div>
            ))}
        </Paper>
    )
}

// Sets the height of every product's details panel, so its loading placeholder uses it too
export const PRICE_CHART_HEIGHT = 280

// The box around the chart, shared with the loading placeholder so both are the same size
export const PRICE_CHART_BOX_CLASS = 'w-7/10 border rounded-sm p-5'

// The space above the chart's plot area, in pixels, which the average legend and the time range control sit in, so
// they stay clear of the line and the highest label
const PRICE_CHART_TOP_MARGIN = 28

type PriceHistoryChartProps = {
    prices: PriceType[]
    dateToday: Date
    timeRange: PriceTimeRange
    setTimeRange: (newVal: PriceTimeRange) => void
    // The plain average of the product's whole history, or null when it has none
    averagePrice: number | null
    currency: string
}

const PriceHistoryChart = ({
    prices,
    dateToday,
    timeRange,
    setTimeRange,
    averagePrice,
    currency
}: PriceHistoryChartProps) => {
    const priceData = usePriceData(dateToday).createPriceData(prices)

    // The y scale, fitted to the prices in view and the average rather than starting from zero, so the line fills the
    // chart's height and its steps are a visible size. It's null with neither, when the chart has nothing to draw.
    const scale = getPriceChartScale(
        priceData.map((point) => point.totalAmount),
        averagePrice
    )

    // A dashed line at the average, as thick as the price line but a lighter gray, so the prices stand out over it.
    // Two pixels keep at least one row of pixels at full strength wherever the average falls, while a one pixel line
    // between two rows is blurred across both and looks fainter on some charts than others. The legend in the corner
    // labels it, with a dash to match, since a label on the line itself would clash with a price close to the average.
    const averageLine =
        averagePrice === null
            ? []
            : [
                  {
                      y: averagePrice,
                      color: 'gray.5',
                      strokeWidth: 2,
                      strokeDasharray: '6 4',
                      // Below the price line's layer (400 by default, like reference lines), so it's drawn behind
                      zIndex: 300
                  }
              ]

    return (
        <div className={`${PRICE_CHART_BOX_CLASS} border-smoke relative`}>
            {/* Placed over the chart's corner, so it doesn't change the panel's height */}
            <SegmentedControl
                aria-label="Time range"
                size="xs"
                radius="xl"
                value={timeRange}
                onChange={(value) => setTimeRange(value as PriceTimeRange)}
                data={PRICE_TIME_RANGE_OPTIONS}
                className="absolute top-2 right-2 z-10"
            />
            {/* The average line's legend, in the top-left corner across from the time range control. The chart's top
                margin keeps the price line and the highest label clear of it. */}
            {averagePrice !== null && (
                <div className="absolute top-3 left-5 z-10 flex items-center gap-1.5 text-xs text-(--mantine-color-gray-6)">
                    <span className="w-5 border-t-2 border-dashed border-(--mantine-color-gray-5)" />
                    {`Average ${getPriceWithCurrency(averagePrice, currency)}`}
                </div>
            )}
            <LineChart
                attributes={{
                    container: {
                        height: PRICE_CHART_HEIGHT
                    }
                }}
                data={priceData}
                dataKey="priceStarted"
                series={[{ name: 'totalAmount', color: 'blue.6' }]}
                referenceLines={[{ x: 'Now' }, ...averageLine]}
                tooltipProps={{
                    content: ({ label, payload }) => <ChartTooltip label={label} payload={payload} />,
                    // Above the time range control (z-10), which a tall tooltip can move up over
                    wrapperStyle: { zIndex: 20 }
                }}
                gridAxis="none"
                // Keeps the highest label and the line below the legend and the time range control, which sit above
                // the plot area. The other sides keep Recharts' default margin.
                lineChartProps={{ margin: { top: PRICE_CHART_TOP_MARGIN, right: 5, bottom: 5, left: 5 } }}
                // Labels each of the scale's round steps, so a step's size can be read off the side. Without a scale,
                // there are no prices to draw, and the axis has no labels either.
                yAxisProps={
                    scale === null
                        ? undefined
                        : {
                              domain: [scale.min, scale.max],
                              ticks: scale.ticks,
                              // Every tick gets a label, which the axis would otherwise thin out when they're close
                              interval: 0,
                              tickFormatter: (value: number) => getPriceChartTickString(value, scale.step, currency),
                              // As wide as the longest label, rather than a fixed width that crops or wastes space
                              width: 'auto'
                          }
                }
                curveType="stepAfter"
            />
        </div>
    )
}

export default PriceHistoryChart
