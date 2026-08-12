import type { ProductType } from '@/utils/Types'
import '@/styles/PriceBanner.css'
import { Tooltip } from '@mantine/core'
import { getBannerType, getLatestPriceAfterToday, getLatestPriceBeforeToday, getPriceDiscount, getPriceString } from '@/utils/PriceUtilities'
import dayjs from 'dayjs'
import { useTimer } from '@/hooks/common/useTimer'

type PriceBannerProps = {
    product: ProductType
}

const PriceBanner = ({product}: PriceBannerProps) => {

    // Banner type of price
    const bannerType = getBannerType(product.prices)

    switch(bannerType) {
        case 'one-year':
            return (
                <Banner
                    color="one-year"
                    bg="one-year-bg"
                    text="ONE YEAR LOW"
                    product={product}
                />
            )
        case 'two-year':
            return (
                <Banner
                    color="two-year"
                    bg="two-year-bg"
                    text="TWO YEAR LOW"
                    product={product}
                />
            )
        case 'all-time':
            return (
                <Banner
                    color="all-time"
                    bg="all-time-bg"
                    text="LOWEST EVER"
                    product={product}
                />
            )
        default:
            return (
                <Banner
                    color=""
                    bg=""
                    text=""
                    product={product}
                />
            )
    }
}

type BannerProps =  {
    text: string
    color: string
    bg: string
    product: ProductType
}

const Banner = ({color, text, bg, product}: BannerProps) => {

    // Latest price PriceType before today
    const latestPrice = getLatestPriceBeforeToday(product.prices)
    // Date stored in latest price
    const latestDate = dayjs(latestPrice?.priceStarted)
    // Number of days since last recorded price
    const priceListLastUpdated = dayjs().diff(latestDate, 'day').toString()

    // Calculate discount and price string
    let discountPercent = 0
    let priceText = ''
    if (latestPrice) {
        discountPercent = getPriceDiscount(product.prices, latestPrice)
        priceText = getPriceString(latestPrice)
    }

    // Calculate the time left for timer
    let timeLeft = ''
    let timer
    const lastPrice = getLatestPriceAfterToday(product.prices)
    if (lastPrice && lastPrice !== latestPrice) {
        timeLeft = dayjs(lastPrice.priceStarted).diff(dayjs(), 'day').toString()
        if (parseInt(timeLeft) <= 7) {
            timer = useTimer(dayjs(lastPrice.priceStarted).valueOf() / 1000)
        }
    }

    const textStyle: string = color ? color : discountPercent >= 50 ? 'good-deal' : ''

    return (
        <>
            {text.length > 0 &&
                <div className={'text-cloud rounded-sm p-2 font-bold min-w-38 flex justify-center ' + bg}>
                    {text}
                </div>
            }

            {discountPercent > 0 ? 
                <div className={'min-w-16.25 text-center ' + textStyle}>
                    {timeLeft !== '' && timer !== undefined ?
                        <Tooltip
                            withArrow
                            label={
                                timeLeft === '1' ?
                                    <>
                                        <div className='flex flex-col items-center'>
                                            <div>
                                                Ends in {timeLeft} day
                                            </div>
                                            <div>
                                                {timer.value}
                                            </div>
                                        </div>
                                    </>
                                    :
                                    <>
                                        <div className='flex flex-col items-center'>
                                            <div>
                                                Ends in {timeLeft} days
                                            </div>
                                            <div>
                                                {timer.value}
                                            </div>
                                        </div>
                                    </>
                            }
                        >
                            <span className='border-b-2 border-red-400'>-{discountPercent}%</span>
                        </Tooltip>
                        :
                        <>-{discountPercent}%</>
                    }
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