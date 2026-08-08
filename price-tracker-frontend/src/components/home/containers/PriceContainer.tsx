import type { PriceType } from "../../../utils/Types"
import Price from '../price/Price'
import { getUSDateStringFromTimestamp } from '../../../utils/DateUtilities'

type PriceProps = {
    price: PriceType
}

const PriceContainer = ({price}: PriceProps) => {

    // Constructing the string to show the date on the PriceList
    const priceStartedDateString = getUSDateStringFromTimestamp(price.priceStarted)

    return (
        <>
            <Price
                price={price}
                priceStartedDateString={priceStartedDateString}
            />
        </>
    )
}

export default PriceContainer