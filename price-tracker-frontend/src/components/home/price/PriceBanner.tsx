import type { PriceType, ProductType } from '@/utils/Types'
import '@/styles/PriceBanner.css'
import { Box, Tooltip } from '@mantine/core'
import { getPriceDiscount, getPriceString } from '@/utils/PriceUtilities'
import dayjs from 'dayjs'
import { usePriceTimer } from '@/hooks/price/usePriceTimer'
import { MdTimer, MdUpdate } from 'react-icons/md'
import { usePriceData } from '@/hooks/price/usePriceData'
import { LuClockAlert } from 'react-icons/lu'

interface BannerStyle {
    color: string
    bg: string
    text: string
}

// Returns the appropriate color, bg, and text depending on the given banner type string
const getBannerStyle = (bannerType: string): BannerStyle => {
    switch (bannerType) {
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

interface TimeTooltip {
    timeLeft: number
    tooltipText: string
}

const TimeTooltip = ({timeLeft, tooltipText}: TimeTooltip) => {
    return (
        <Box>
            <Tooltip
                withArrow
                label={
                    <div className='flex flex-col items-center'>
                        <div>
                            Ends in
                        </div>
                        <div>
                            {tooltipText}
                        </div>
                    </div>
                }
            >
                {timeLeft >= 1 ?
                    <MdTimer size={24} className='text-amber-400' />
                    :
                    <MdTimer size={24} className='text-red-400' />
                }
            </Tooltip>
        </Box>
    )
}

export interface PriceBanner {
    product: ProductType
    dateToday: Date
    setDateToday: (newVal: Date) => void
    mini?: boolean
}

export const PriceBanner = ({ product, dateToday, setDateToday, mini }: PriceBanner) => {

    if (!product.prices || product.prices.length === 0) {
        return <></>
    }

    // Use priceData hook
    const priceData = usePriceData(dateToday)

    // Latest price PriceType before today
    const latestPrice = priceData.getLatestPriceBeforeToday(product.prices)

    // Date stored in latest price
    const mostRecentUpdatedPrice = dayjs(getMostRecentlyUpdatedPrice(product.prices)?.updatedAt)
    // Number of days since last recorded price
    const priceListLastUpdated = dayjs().diff(mostRecentUpdatedPrice, 'day')
    let lastUpdatedIndicator = undefined
    if (priceListLastUpdated > 7) {
        lastUpdatedIndicator = (
            <div>
                <Tooltip
                    withArrow
                    label={priceListLastUpdated === 1 ? `Last updated ${priceListLastUpdated} day ago` : `Last updated ${priceListLastUpdated} days ago`}
                >
                    <LuClockAlert />
                </Tooltip>
            </div>
        )
    }

    // Calculate discount and price string
    const priceText = getPriceString(latestPrice)
    const discountPercent = getPriceDiscount(product.prices, latestPrice)

    // Banner style based on banner type & percentage
    const { color, bg, text } = getBannerStyle(priceData.getBannerType(product.prices))
    const textStyle: string = color ? color : discountPercent >= 50 ? 'good-deal' : ''

    // Calculate time since last price before today
    let recentPriceChange = undefined
    if (latestPrice) {
        const recentPriceChangeDays = dayjs().diff(latestPrice.priceStarted, 'day')
        if (recentPriceChangeDays <= 6) {
            recentPriceChange = (
                <div>
                    <Tooltip
                        withArrow
                        label={recentPriceChangeDays === 1 ? `Price change ${recentPriceChangeDays} day ago` : `Price change ${recentPriceChangeDays} days ago`}
                    >
                        <MdUpdate />
                    </Tooltip>
                </div>
            )
        }
    }

    // Calculate the time left for timer
    const lastPrice = priceData.getLatestPriceAfterToday(product.prices)
    let timerText = usePriceTimer(dayjs(lastPrice?.priceStarted).valueOf() / 1000, setDateToday)
    let timeTooltip = undefined
    if (latestPrice && lastPrice && lastPrice !== latestPrice) {
        const timeLeft = dayjs(lastPrice.priceStarted).diff(dayjs(), 'day')
        if (timeLeft <= 6) {
            timeTooltip = <TimeTooltip timeLeft={timeLeft} tooltipText={timerText} />
        }
    }

    // Shows recent price changes, last updated (if < 7 days), and time left on current price (if < 7 days)
    const priceIndicators = (
        <>
            {/* Recent price change text */}
            {recentPriceChange}

            {/* Last updated indicator */}
            {lastUpdatedIndicator}

            {/* Timer text */}
            {timeTooltip}
        </>
    )

    if (mini) {
        return (
            <>
                {/* Informational indicators */}
                {priceIndicators}

                {/* Price banner */}
                {text.length > 0 &&
                    <div className={'text-cloud rounded-sm p-1 font-bold flex justify-center ' + bg}>
                        -{discountPercent}%
                    </div>
                }
            </>
        )
    }

    return (
        <>
            {/* Informational indicators */}
            {priceIndicators}

            {/* Price banner */}
            {text.length > 0 &&
                <div className={'text-cloud rounded-sm p-2 font-bold min-w-38 flex justify-center ' + bg}>
                    {text}
                </div>
            }

            {/* Discount percentage */}
            {discountPercent > 0 && 
                <div className={'min-w-16.25 text-center ' + textStyle}>
                    -{discountPercent}%
                </div>
            }

            {/* Price text */}
            <div className={'min-w-17.5 text-right ' + textStyle}>
                {latestPrice && latestPrice.returnAmount > 0 ?
                    <Tooltip withArrow label={<>{latestPrice.amount} (base) - {latestPrice.returnAmount} (return)</>}>
                        <div>{priceText}</div>
                    </Tooltip>
                    :
                    <>{priceText}</>
                }
            </div>
        </>
    )
}