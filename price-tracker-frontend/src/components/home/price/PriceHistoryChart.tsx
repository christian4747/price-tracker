import { Line, LineChart, Tooltip, XAxis, type TooltipContentProps } from 'recharts'

type Props = {
    priceData: any[]
}

const PriceHistoryTooltip = ({active, payload, label}: TooltipContentProps) => {
    const firstPayload = payload?.[0];
    const isVisible = active && firstPayload != null;
    return (
        <div
            className="custom-tooltip"
            style={{
                visibility: isVisible ? 'visible' : 'hidden'
            }}
        >
        {isVisible && (
            <div className='m-0 p-3 bg-[#F4F4F4] border-1 border-[#BCBBBD] rounded-sm whitespace-nowrap flex flex-col'>
                <p className="label">{`${label}`}</p>
                <p>{`Price: $${firstPayload.value}`}</p>
            </div>
        )}
        </div>
    );
}

const PriceHistoryChart = ({priceData}: Props) => {
    return (
        <div className='w-7/10 border-1 border-[#BCBBBD] rounded-sm p-1'>
            <LineChart style={{ width: '100%', aspectRatio: 3}} responsive data={priceData}>
                <XAxis dataKey="priceStarted" />
                <Line  dataKey="price" />
                <Tooltip content={PriceHistoryTooltip} />
            </LineChart>
        </div>
    )
}

export default PriceHistoryChart