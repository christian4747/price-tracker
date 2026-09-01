import { usePriceData } from '@/hooks/price/usePriceData'
import type { ProductType } from '@/utils/Types'
import { LineChart, type ChartTooltipProps } from '@mantine/charts'
import { Paper, Text } from '@mantine/core'

const getPriceWithCurrency = (amount: number, currency: string) => {
    try {
        return new Intl.NumberFormat(undefined, { style: "currency", currency: currency }).format(amount)
    } catch {
        return new Intl.NumberFormat(undefined, { style: "currency", currency: 'USD' }).format(amount)
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
                    {item.payload.description ? <p className='text-raincloud max-w-75 wrap-break-word'>{`${item.payload.description}`}</p> : <></>}
                </Text>
            ))}
        </Paper>
    )
}

type PriceHistoryChartProps = {
    product: ProductType
    dateToday: Date
}

const PriceHistoryChart = ({product, dateToday}: PriceHistoryChartProps) => {
    const priceData = usePriceData(dateToday).createPriceData(product.prices)

    return (
        <div className='w-7/10 border border-smoke rounded-sm p-5'>
            <LineChart
                attributes={{
                    container: {
                        height: 230
                    }
                }}
                data={priceData}
                dataKey="priceStarted"
                series={[
                    { name: 'price', color: 'blue.6'}
                ]}
                referenceLines={[
                    { x: 'Now'}
                ]}
                tooltipProps={{
                    content: ({ label, payload }) => <ChartTooltip label={label} payload={payload} />,
                }}
                gridAxis='none'
                withYAxis={false}
                curveType='stepAfter'
            />
        </div>
    )
}

export default PriceHistoryChart