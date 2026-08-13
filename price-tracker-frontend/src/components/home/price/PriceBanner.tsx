import type { ProductType } from '@/utils/Types'
import '@/styles/PriceBanner.css'
import { Tooltip } from '@mantine/core'
import { getPriceDiscount, getPriceString } from '@/utils/PriceUtilities'
import dayjs from 'dayjs'
import { usePriceTimer } from '@/hooks/price/usePriceTimer'
import { MdTimer } from 'react-icons/md'
import { usePriceData } from '@/hooks/price/usePriceData'

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
    const latestDate = dayjs(latestPrice?.priceStarted)
    // Number of days since last recorded price
    const priceListLastUpdated = dayjs().diff(latestDate, 'day').toString()

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
            <div className={'min-w-17.5 text-right ' + textStyle}>
                {priceText?.length > 0 && parseInt(priceListLastUpdated) >= 7 ? 
                    <div>
                        <Tooltip withArrow label={priceListLastUpdated === '1' ? `${priceListLastUpdated} day old` : `${priceListLastUpdated} days old`}>
                            <span className='underline underline-offset-5 decoration-wavy'>{priceText}</span>
                        </Tooltip>
                    </div>
                    :
                    <>{priceText}</>
                }
            </div>
        </>
    )
}

export default PriceBanner