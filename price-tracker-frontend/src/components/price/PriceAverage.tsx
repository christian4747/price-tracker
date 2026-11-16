import type { ProductBody } from '@/types/product'
import { getAmountString } from '@/utils/priceUtils'
import { Tooltip } from '@mantine/core'

interface PriceAverage {
    productBody: ProductBody
}

/**
 * The product's average price, for the footer under its price list, with the weighted average in its hover. Shows
 * nothing when the backend leaves the averages out.
 */
export const PriceAverage = ({ productBody }: PriceAverage) => {
    const { averagePrice, weightedAveragePrice, priceToday } = productBody

    // The backend leaves these out when no price has started or the prices use different currencies
    if (averagePrice === null || weightedAveragePrice === null) return <></>

    const currency = priceToday?.currency || 'USD'

    return (
        <Tooltip
            withArrow
            label={`Weighted by how long each price lasted: ${getAmountString(weightedAveragePrice, currency)}`}
        >
            {/* Small and gray like the row details, with the amount in the text's own color so it still stands out */}
            <span className="text-sm text-raincloud">
                Average{' '}
                <span className="font-medium text-(--mantine-color-text)">
                    {getAmountString(averagePrice, currency)}
                </span>
            </span>
        </Tooltip>
    )
}
