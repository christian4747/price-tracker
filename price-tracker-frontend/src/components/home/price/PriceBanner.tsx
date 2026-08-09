import type { ProductType } from '@/utils/Types'
import '../../../styles/PriceBanner.css'
import { Tooltip } from '@mantine/core'
import { getLatestUpdatedPrice } from '@/utils/PriceUtilities'
import dayjs from 'dayjs'

type BannerPriceProps = {
    discountPercent: number
    price: string
    color?: string
    priceListLastUpdated: string
}

const BannerPrice = ({discountPercent, price, color, priceListLastUpdated}: BannerPriceProps) => {
    const textStyle: string = color ? color : discountPercent >= 50 ? 'good-deal' : ''

    return (
        <>
            {discountPercent > 0 ? 
                <div className={'min-w-16.25 text-center ' + textStyle}>
                    -{discountPercent}%
                </div>
                : <></>
            }

            <div className={'min-w-17.5 text-right ' + textStyle}>
                {parseInt(priceListLastUpdated) >= 7 ? 
                    <div>
                        $
                        <Tooltip label={priceListLastUpdated === '1' ? `${priceListLastUpdated} day old` : `${priceListLastUpdated} days old`}>
                            <span className='underline underline-offset-5 decoration-wavy'>{price}</span>
                        </Tooltip>
                    </div>
                    :
                    <>${price}</>
                }
            </div>
        </>
    )
}

type BannerProps = BannerPriceProps & {
    text: string
    color: string
    bg: string
    priceListLastUpdated: string
}

const Banner = ({discountPercent, price, color, text, bg, priceListLastUpdated}: BannerProps) => {
    return (
        <>
            <div className={'text-cloud rounded-sm p-2 font-bold min-w-38 flex justify-center ' + bg}>
                {text}
            </div>

            <BannerPrice discountPercent={discountPercent} price={price} color={color} priceListLastUpdated={priceListLastUpdated}/>
        </>
    )
}

type PriceBannerProps = {
    bannerType?: 'one-year' | 'two-year' | 'all-time' | ''
    discountPercent?: number
    price?: string
    product: ProductType
}

const PriceBanner = (props: PriceBannerProps) => {
    if (!props.price && !props.discountPercent) 
        return <></>
    
    if (!props.price)
        return <></>
    
    const priceText = parseFloat(props.price).toFixed(2)

    const priceListLastUpdated = dayjs().diff(getLatestUpdatedPrice(props.product.prices), 'day').toString()

    if (!props.discountPercent) 
        return <BannerPrice discountPercent={0} price={priceText} priceListLastUpdated={priceListLastUpdated}/>

    if (!props.bannerType && props.discountPercent > 0) 
        return <BannerPrice discountPercent={props.discountPercent} price={priceText} priceListLastUpdated={priceListLastUpdated}/>
    
    switch(props.bannerType) {
        case 'one-year':
            return (
                <Banner
                    discountPercent={props.discountPercent}
                    price={priceText}
                    color="one-year"
                    bg="one-year-bg"
                    text="ONE YEAR LOW"
                    priceListLastUpdated={priceListLastUpdated}
                />
            )
        case 'two-year':
            return (
                <Banner
                    discountPercent={props.discountPercent}
                    price={priceText}
                    color="two-year"
                    bg="two-year-bg"
                    text="TWO YEAR LOW"
                    priceListLastUpdated={priceListLastUpdated}
                />
            )
        case 'all-time':
            return (
                <Banner
                    discountPercent={props.discountPercent}
                    price={priceText}
                    color="all-time"
                    bg="all-time-bg"
                    text="LOWEST EVER"
                    priceListLastUpdated={priceListLastUpdated}
                />
            )
        default:
            return (
                <BannerPrice
                    discountPercent={props.discountPercent}
                    price={priceText}
                    priceListLastUpdated={priceListLastUpdated}
                />
            )
    }
}

export default PriceBanner