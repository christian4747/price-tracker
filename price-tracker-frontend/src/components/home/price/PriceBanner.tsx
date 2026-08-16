import type { PriceType, ProductType } from '@/utils/Types'
import '@/styles/PriceBanner.css'
import { Tooltip } from '@mantine/core'
import { getPriceDiscount, getPriceString } from '@/utils/PriceUtilities'
import dayjs from 'dayjs'
import { usePriceTimer } from '@/hooks/price/usePriceTimer'
import { MdTimer } from 'react-icons/md'
import { usePriceData } from '@/hooks/price/usePriceData'
import { LuClockAlert } from 'react-icons/lu'

type BannerStyle = {
    color: string
    bg: string
    text: string
}

// Returns the appropriate color, bg, and text depending on the given banner type string
const getBannerStyle = (bannerType: string): BannerStyle => {
    switch(bannerType) {
        case 'one-year':
            return { color: 'one-year', bg: 'one-year-bg', text: 'ONE YEAR LOW' }
        case 'two-year':
            return { color: 'two-year', bg: 'two-year-bg', text: 'TWO YEAR LOW' }
        case 'all-time':
            return { color: 'all-time', bg: 'all-time-bg', text: 'LOWEST EVER' }
        default:
            return { color: '', bg: '', text: '' }
    }
}

const getMostRecentlyUpdatedPrice = (prices: PriceType[]) => {
    if (!prices) return
    if (prices.length === 1) return prices[0]

    let mostRecent = prices[0]

    for (const price of prices) {
        if (price.updatedAt > mostRecent.updatedAt) {
            mostRecent = price
        }
    }

    return mostRecent
}

type PriceBannerProps =  {
    product: ProductType
    dateToday: Date
    setDateToday: (newVal: Date) => void
}

const PriceBanner = ({ product, dateToday, setDateToday }: PriceBannerProps) => {

    // Use priceData hook
    const priceData = usePriceData(dateToday)

    // Latest price PriceType before today
    const latestPrice = priceData.getLatestPriceBeforeToday(product.prices)

    // Date stored in latest price
    const mostRecentUpdatedPrice = dayjs(getMostRecentlyUpdatedPrice(product.prices)?.updatedAt)
    // Number of days since last recorded price
    const priceListLastUpdated = dayjs().diff(mostRecentUpdatedPrice, 'day').toString()

    // Calculate discount and price string
    const priceText = getPriceString(latestPrice)
    const discountPercent = getPriceDiscount(product.prices, latestPrice)

    // Banner style based on banner type & percentage
    const { color, bg, text } = getBannerStyle(priceData.getBannerType(product.prices))
    const textStyle: string = color ? color : discountPercent >= 50 ? 'good-deal' : ''

    // Calculate the time left for timer
    let useTimerText = false
    let timeLeft = ''
    const lastPrice = priceData.getLatestPriceAfterToday(product.prices)
    let timerText = usePriceTimer(dayjs(lastPrice?.priceStarted).valueOf() / 1000, setDateToday)
    if (latestPrice && lastPrice && lastPrice !== latestPrice && latestPrice.amount < lastPrice.amount) {
        timeLeft = dayjs(lastPrice.priceStarted).diff(dayjs(), 'day').toString()
        if (parseInt(timeLeft) <= 6) {
            useTimerText = true
        }
    }

    return (
        <>
            {priceText?.length > 0 && parseInt(priceListLastUpdated) >= 7 &&
                <div>
                    <Tooltip withArrow label={priceListLastUpdated === '1' ? `Last updated ${priceListLastUpdated} day ago` : `Last updated ${priceListLastUpdated} days ago`}>
                        <span className='underline underline-offset-5 decoration-wavy'><LuClockAlert /></span>
                    </Tooltip>
                </div>
            }

            {/* Timer text */}
            {useTimerText && timerText !== '' &&
                <div>
                    <Tooltip
                        withArrow
                        label={
                            <div className='flex flex-col items-center'>
                                <div>
                                    Ends in
                                </div>
                                <div>
                                    {timerText}
                                </div>
                            </div>
                        }
                    >
                        {parseInt(timeLeft) >= 1 ?
                            <MdTimer size={24} className='text-amber-400'/>
                            :
                            <MdTimer size={24} className='text-red-400'/>
                        }
                    </Tooltip>
                </div>
            }

            {/* Price banner */}
            {text.length > 0 &&
                <div className={'text-cloud rounded-sm p-2 font-bold min-w-38 flex justify-center ' + bg}>
                    {text}
                </div>
            }

            {/* Discount percentage */}
            {discountPercent > 0 && 
                <div className={'min-w-16.25 text-center ' + textStyle}>
                    <>-{discountPercent}%</>
                </div>
            }

            {/* Price text */}
            {latestPrice && latestPrice.returnAmount > 0 ?
                <Tooltip withArrow label={<>{latestPrice.amount} (base) - {latestPrice.returnAmount} (return)</>}>
                    <div className={'min-w-17.5 text-right ' + textStyle}>
                        {priceText}
                    </div>
                </Tooltip>
                :
                <div className={'min-w-17.5 text-right ' + textStyle}>
                    {priceText}
                </div>
            }
        </>
    )
}

export default PriceBanner