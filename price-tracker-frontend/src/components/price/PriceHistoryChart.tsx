import { usePriceData } from '@/hooks/price/usePriceData'
import type { PriceType } from '@/types/price'
import { LineChart, type ChartTooltipProps } from '@mantine/charts'
import { Paper, Text } from '@mantine/core'

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

type PriceHistoryChartProps = {
    prices: PriceType[]
    dateToday: Date
}

const PriceHistoryChart = ({ prices, dateToday }: PriceHistoryChartProps) => {
    const priceData = usePriceData(dateToday).createPriceData(prices)

    return (
        <div className={`${PRICE_CHART_BOX_CLASS} border-smoke`}>
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
                    content: ({ label, payload }) => <ChartTooltip label={label} payload={payload} />
                }}
                gridAxis="none"
                withYAxis={false}
                curveType="stepAfter"
            />
        </div>
    )
}

export default PriceHistoryChart
