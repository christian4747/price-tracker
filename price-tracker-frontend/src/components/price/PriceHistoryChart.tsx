import { Line, LineChart, Tooltip, XAxis } from 'recharts'

type Props = {
    priceData: any[]
}

const PriceHistoryChart = ({priceData}: Props) => {
    return (
        <div className='w-7/10 border-1 border-[#BCBBBD] rounded-sm p-1'>
            <LineChart style={{ width: '100%', aspectRatio: 3}} responsive data={priceData}>
                <XAxis dataKey="priceStarted" />
                <Line type="stepAfter" dataKey="price" />
                <Tooltip />
            </LineChart>
        </div>
    )
}

export default PriceHistoryChart