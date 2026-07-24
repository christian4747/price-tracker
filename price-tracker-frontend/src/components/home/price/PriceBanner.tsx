type BannerPriceProps = {
    discountPercent: number,
    price: string,
    color?: string,
}

const BannerPrice = ({discountPercent, price, color}: BannerPriceProps) => {
    const textStyle: string = color ? color : discountPercent >= 50 ? 'green-500' : 'raisin'

    return (
        <>
            {discountPercent > 0 ? 
                <div className={'min-w-16.25 text-center text-' + color}>
                    -{discountPercent}%
                </div>
                : <></>
            }

            <div className={'min-w-17.5 text-right text-' + textStyle}>
                ${price}
            </div>
        </>
    )
}

type BannerProps = BannerPriceProps & {
    text: string,
    color: string
}

const Banner = ({discountPercent, price, color, text}: BannerProps) => {
    return (
        <>
            <div className={'text-cloud rounded-sm p-2 font-mono font-bold min-w-32.5 flex justify-center bg-' + color}>
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
                    color="emerald-400"
                    text="ONE YEAR LOW"
                />
            )
        case 'two-year':
            return (
                <Banner
                    discountPercent={props.discountPercent}
                    price={priceText}
                    color="blue-400"
                    text="TWO YEAR LOW"
                />
            )
        case 'all-time':
            return (
                <Banner
                    discountPercent={props.discountPercent}
                    price={priceText}
                    color="red-400"
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