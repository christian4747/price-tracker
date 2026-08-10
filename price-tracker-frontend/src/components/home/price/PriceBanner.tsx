import type { ProductType } from '@/utils/Types'
import '../../../styles/PriceBanner.css'
import { Tooltip } from '@mantine/core'
import { getBannerType, getLatestPriceBeforeToday, getPriceDiscount } from '@/utils/PriceUtilities'
import dayjs from 'dayjs'

type PriceBannerProps = {
    product: ProductType
}

const PriceBanner = ({product}: PriceBannerProps) => {

    // Latest price PriceType before today
    const latestPrice = getLatestPriceBeforeToday(product.prices)
    // Date stored in latest price
    const latestDate = dayjs(latestPrice?.priceStarted)
    // Number of days since last recorded price
    const priceListLastUpdated = dayjs().diff(latestDate, 'day').toString()
    // Banner type of price
    const bannerType = getBannerType(product.prices)

    // Calculate discount and price string
    let discount = 0
    let priceText = ''
    if (latestPrice) {
        discount = getPriceDiscount(product.prices, latestPrice)
        if (latestPrice.currency) {
            priceText = new Intl.NumberFormat(undefined, { style: "currency", currency: latestPrice.currency }).format(parseFloat(latestPrice.amount))
        } else {
            priceText = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(parseFloat(latestPrice.amount))
        }
    }
    
    switch(bannerType) {
        case 'one-year':
            return (
                <Banner
                    discountPercent={discount}
                    priceText={priceText}
                    color="one-year"
                    bg="one-year-bg"
                    text="ONE YEAR LOW"
                    priceListLastUpdated={priceListLastUpdated}
                />
            )
        case 'two-year':
            return (
                <Banner
                    discountPercent={discount}
                    priceText={priceText}
                    color="two-year"
                    bg="two-year-bg"
                    text="TWO YEAR LOW"
                    priceListLastUpdated={priceListLastUpdated}
                />
            )
        case 'all-time':
            return (
                <Banner
                    discountPercent={discount}
                    priceText={priceText}
                    color="all-time"
                    bg="all-time-bg"
                    text="LOWEST EVER"
                    priceListLastUpdated={priceListLastUpdated}
                />
            )
        default:
            return (
                <Banner
                    discountPercent={discount}
                    priceText={priceText}
                    color=""
                    bg=""
                    text=""
                    priceListLastUpdated={priceListLastUpdated}
                />
            )
    }
}

type BannerProps =  {
    text: string
    color: string
    bg: string
    priceListLastUpdated: string
    discountPercent: number
    priceText: string
}

const Banner = ({discountPercent, priceText, color, text, bg, priceListLastUpdated}: BannerProps) => {

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
                    -{discountPercent}%
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