import type { ProductType } from '@/utils/Types'
import '@/styles/PriceBanner.css'
import { Tooltip } from '@mantine/core'
import { getPriceDiscount, getPriceString } from '@/utils/PriceUtilities'
import dayjs from 'dayjs'
import { useTimer } from '@/hooks/common/useTimer'
import { MdTimer } from 'react-icons/md'
import { usePriceData } from '@/hooks/price/usePriceData'

type PriceBannerProps = {
    product: ProductType
    dateToday: Date
    setDateToday: (newVal: Date) => void
}

const PriceBanner = ({ product, dateToday, setDateToday }: PriceBannerProps) => {

    // Banner type of price
    const bannerType = usePriceData(dateToday).getBannerType(product.prices)

    switch(bannerType) {
        case 'one-year':
            return (
                <Banner
                    color="one-year"
                    bg="one-year-bg"
                    text="ONE YEAR LOW"
                    product={product}
                    dateToday={dateToday}
                    setDateToday={setDateToday}
                />
            )
        case 'two-year':
            return (
                <Banner
                    color="two-year"
                    bg="two-year-bg"
                    text="TWO YEAR LOW"
                    product={product}
                    dateToday={dateToday}
                    setDateToday={setDateToday}
                />
            )
        case 'all-time':
            return (
                <Banner
                    color="all-time"
                    bg="all-time-bg"
                    text="LOWEST EVER"
                    product={product}
                    dateToday={dateToday}
                    setDateToday={setDateToday}
                />
            )
        default:
            return (
                <Banner
                    color=""
                    bg=""
                    text=""
                    product={product}
                    dateToday={dateToday}
                    setDateToday={setDateToday}
                />
            )
    }
}

type BannerProps =  {
    text: string
    color: string
    bg: string
    product: ProductType
    dateToday: Date
    setDateToday: (newVal: Date) => void
}

const Banner = ({ color, text, bg, product, dateToday, setDateToday }: BannerProps) => {

    const priceData = usePriceData(dateToday)

    // Latest price PriceType before today
    const latestPrice = priceData.getLatestPriceBeforeToday(product.prices)
    // Date stored in latest price
    const latestDate = dayjs(latestPrice?.priceStarted)
    // Number of days since last recorded price
    const priceListLastUpdated = dayjs().diff(latestDate, 'day').toString()

    const discountPercent = getPriceDiscount(product.prices, latestPrice)

    // Calculate discount and price string
    let priceText = ''
    priceText = getPriceString(latestPrice)

    // Calculate the time left for timer
    let timeLeft = ''
    const lastPrice = priceData.getLatestPriceAfterToday(product.prices)
    let timerText = useTimer(dayjs(lastPrice?.priceStarted).valueOf() / 1000, setDateToday)
    if (lastPrice && lastPrice !== latestPrice) {
        timeLeft = dayjs(lastPrice.priceStarted).diff(dayjs(), 'day').toString()
    }

    const textStyle: string = color ? color : discountPercent >= 50 ? 'good-deal' : ''

    return (
        <>
            {timerText !== '' ?
                <div>
                    <Tooltip
                        withArrow
                        label={
                            timeLeft === '1' ?
                                <>
                                    <div className='flex flex-col items-center'>
                                        <div>
                                            Ends in
                                        </div>
                                        <div>
                                            {timerText}
                                        </div>
                                    </div>
                                </>
                                :
                                <>
                                    <div className='flex flex-col items-center'>
                                        <div>
                                            Ends in
                                        </div>
                                        <div>
                                            {timerText}
                                        </div>
                                    </div>
                                </>
                        }
                    >
                        {parseInt(timeLeft) >= 1 ? <MdTimer size={24} className='text-amber-400'/> : <MdTimer size={24} className='text-red-400'/>}
                        </Tooltip>
                </div>
                :
                <></>
            }

            {text.length > 0 &&
                <div className={'text-cloud rounded-sm p-2 font-bold min-w-38 flex justify-center ' + bg}>
                    {text}
                </div>
            }

            {discountPercent > 0 ? 
                <div className={'min-w-16.25 text-center ' + textStyle}>
                        <>-{discountPercent}%</>
                </div>
                : <></>
            }
            
            <div className={'min-w-17.5 text-right ' + textStyle}>
                {priceText?.length > 0 ? parseInt(priceListLastUpdated) >= 7 ? 
                    <div>
                        <Tooltip withArrow label={priceListLastUpdated === '1' ? `${priceListLastUpdated} day old` : `${priceListLastUpdated} days old`}>
                            <span className='underline underline-offset-5 decoration-wavy'>{priceText}</span>
                        </Tooltip>
                    </div>
                    :
                    <>{priceText}</>
                    : <></>
                }
            </div>
            
        </>
    )
}


export default PriceBanner