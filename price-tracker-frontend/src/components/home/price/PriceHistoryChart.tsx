import { usePriceData } from '@/hooks/price/usePriceData'
import type { ProductType } from '@/utils/Types'
import { Line, LineChart, ReferenceLine, Tooltip, XAxis, type TooltipContentProps } from 'recharts'

const getPriceWithCurrency = (amount: number, currency: string) => {
    if (!currency || currency.length === 0) currency = 'USD'
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency }).format(amount)
}

const PriceHistoryTooltip = ({active, payload, label}: TooltipContentProps) => {
    const firstPayload = payload?.[0]
    const isVisible = active && firstPayload != null
    return (
        <div
            className="custom-tooltip"
            style={{
                visibility: isVisible ? 'visible' : 'hidden'
            }}
        >
        {isVisible && (
            <div className='m-0 p-3 bg-cloud border border-smoke rounded-sm flex flex-col flex-wrap w-full h-full'>
                <p className="label">{`${label}`}</p>
                <p>{`Price: ${getPriceWithCurrency(firstPayload.value as number, firstPayload.payload.currency as string)}`}</p>
                {firstPayload.payload.description ? <p className='text-raincloud max-w-75 wrap-break-word'>{`${firstPayload.payload.description}`}</p> : <></> }
            </div>
        )}
        </div>
    );
}

type PriceHistoryChartProps = {
    product: ProductType
    dateToday: Date
}

const PriceHistoryChart = ({product, dateToday}: PriceHistoryChartProps) => {
    const priceData = usePriceData(dateToday).createPriceData(product.prices)

    return (
        <div className='w-7/10 border border-smoke rounded-sm p-1'>
            <LineChart style={{ width: '100%', aspectRatio: 3}} responsive data={priceData}>
                <XAxis dataKey="priceStarted" />
                <ReferenceLine x="Now" />
                <Line type="stepAfter" dataKey="price" />
                <Tooltip content={PriceHistoryTooltip} />
            </LineChart>
        </div>
    )
}

export default PriceHistoryChart