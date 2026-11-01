import type { ProductBody } from '@/types/product'
import { getAmountString } from '@/utils/priceUtils'
import { Tooltip } from '@mantine/core'

interface PriceAverage {
    productBody: ProductBody
}

export const PriceAverage = ({ productBody }: PriceAverage) => {
    const { averagePrice, weightedAveragePrice, priceToday } = productBody

    // The backend leaves these out when no price has started or the prices use different currencies
    if (averagePrice === null || weightedAveragePrice === null) return <></>

    const currency = priceToday?.currency || 'USD'

    return (
        <div className="px-2 pt-2">
            <Tooltip
                withArrow
                label={`Weighted by how long each price lasted: ${getAmountString(weightedAveragePrice, currency)}`}
            >
                <span>Average price: {getAmountString(averagePrice, currency)}</span>
            </Tooltip>
        </div>
    )
}
