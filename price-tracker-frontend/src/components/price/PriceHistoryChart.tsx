import { usePriceData } from '@/hooks/price/usePriceData'
import type { PriceTimeRange, PriceType } from '@/types/price'
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
                <Text key={item.name} c={item.color} fz="sm">
                    Price: {getPriceWithCurrency(item.value, item.payload.currency)}
                    {item.payload.description ? (
                        <p className="text-raincloud max-w-75 wrap-break-word">{`${item.payload.description}`}</p>
                    ) : (
                        <></>
                    )}
                </Text>
            ))}
        </Paper>
    )
}

// Sets the height of every product's details panel, so its loading placeholder uses it too
export const PRICE_CHART_HEIGHT = 280

// The box around the chart, shared with the loading placeholder so both are the same size
export const PRICE_CHART_BOX_CLASS = 'w-7/10 border rounded-sm p-5'

// The top of the chart's scale, as a multiple of the highest price or the average, whichever is higher
const PRICE_CHART_HEADROOM = 1.25

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

    // A dashed line at the average, as thick as the price line. The legend in the corner labels it, since a label on
    // the line itself would clash with a price close to the average.
    const averageLine =
        averagePrice === null
            ? []
            : [
                  {
                      y: averagePrice,
                      color: 'gray.6',
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
            {/* The average line's legend, in the top-left corner across from the time range control. The headroom
                above the highest price keeps the price line clear of it. */}
            {averagePrice !== null && (
                <div className="absolute top-3 left-5 z-10 flex items-center gap-1.5 text-xs text-(--mantine-color-gray-6)">
                    <span className="w-5 border-t-2 border-dashed border-(--mantine-color-gray-6)" />
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
                withYAxis={false}
                // Leaves the top fifth of the chart above the highest price, so the line never runs under the time
                // range control in the corner. A shorter time range can leave the average above every price in view,
                // so the scale makes room for it too.
                yAxisProps={{
                    domain: [0, (highest: number) => Math.max(highest, averagePrice ?? 0) * PRICE_CHART_HEADROOM]
                }}
                curveType="stepAfter"
            />
        </div>
    )
}

export default PriceHistoryChart
