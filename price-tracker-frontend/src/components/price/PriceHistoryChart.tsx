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

// The room around the chart inside its pane, shared with the loading placeholder so both are the same size
export const PRICE_CHART_BOX_CLASS = 'p-5'

// The top of the chart's scale, as a multiple of the highest price
const PRICE_CHART_HEADROOM = 1.25

type PriceHistoryChartProps = {
    prices: PriceType[]
    dateToday: Date
    timeRange: PriceTimeRange
    setTimeRange: (newVal: PriceTimeRange) => void
}

const PriceHistoryChart = ({ prices, dateToday, timeRange, setTimeRange }: PriceHistoryChartProps) => {
    const priceData = usePriceData(dateToday).createPriceData(prices)

    return (
        <div className={`${PRICE_CHART_BOX_CLASS} w-full relative`}>
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
            <LineChart
                attributes={{
                    container: {
                        height: PRICE_CHART_HEIGHT
                    }
                }}
                data={priceData}
                dataKey="priceStarted"
                series={[{ name: 'totalAmount', color: 'blue.6' }]}
                referenceLines={[{ x: 'Now' }]}
                tooltipProps={{
                    content: ({ label, payload }) => <ChartTooltip label={label} payload={payload} />,
                    // Above the time range control (z-10), which a tall tooltip can move up over
                    wrapperStyle: { zIndex: 20 }
                }}
                gridAxis="none"
                withYAxis={false}
                // Leaves the top fifth of the chart above the highest price, so the line never runs under the time
                // range control in the corner
                yAxisProps={{ domain: [0, (highest: number) => highest * PRICE_CHART_HEADROOM] }}
                curveType="stepAfter"
            />
        </div>
    )
}

export default PriceHistoryChart
