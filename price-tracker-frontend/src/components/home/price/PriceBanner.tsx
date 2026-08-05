import '../../../styles/PriceBanner.css'

type BannerPriceProps = {
    discountPercent: number,
    price: string,
    color?: string,
}

const BannerPrice = ({discountPercent, price, color}: BannerPriceProps) => {
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
                ${price}
            </div>
        </>
    )
}

type BannerProps = BannerPriceProps & {
    text: string,
    color: string,
    bg: string
}

const Banner = ({discountPercent, price, color, text, bg}: BannerProps) => {
    return (
        <>
            <div className={'text-cloud rounded-sm p-2 font-bold min-w-38 flex justify-center ' + bg}>
                {text}
            </div>

            <BannerPrice discountPercent={discountPercent} price={price} color={color}/>
        </>
    )
}

type PriceBannerProps = {
    bannerType?: 'one-year' | 'two-year' | 'all-time' | '',
    discountPercent?: number,
    price?: string
}

const PriceBanner = (props: PriceBannerProps) => {
    if (!props.price && !props.discountPercent) 
        return <></>
    
    if (!props.price)
        return <></>
    
    const priceText = parseFloat(props.price).toFixed(2)

    if (!props.discountPercent) 
        return <BannerPrice discountPercent={0} price={priceText} />

    if (!props.bannerType && props.discountPercent > 0) 
        return <BannerPrice discountPercent={props.discountPercent} price={priceText} />
    
    switch(props.bannerType) {
        case 'one-year':
            return (
                <Banner
                    discountPercent={props.discountPercent}
                    price={priceText}
                    color="one-year"
                    bg="one-year-bg"
                    text="ONE YEAR LOW"
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
                />
            )
        default:
            return (
                <BannerPrice
                    discountPercent={props.discountPercent}
                    price={priceText}
                />
            )
    }
}

export default PriceBanner