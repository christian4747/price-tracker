type PriceBannerTextProps = {
    children: React.ReactNode,
    className: string
}

const PriceBannerText = ({children, className}: PriceBannerTextProps) => {
    return (
        <div className={'text-[#F4F4F4] rounded-sm p-2 font-mono font-bold min-w-[130px] flex justify-center ' + className}>
            {children}
        </div>
    )
}

type DiscountDisplayProps = {
    discountPercent: number,
    className?: string
}

const DiscountDisplay = ({discountPercent, className}: DiscountDisplayProps) => {
    return (
        <>
            {discountPercent > 0 ? 
                <div className={'min-w-[65px] text-center ' +className}>
                    -{discountPercent}%
                </div>
                : <></>
            }
        </>
    )
}

type BannerProps = {
    discountPercent: number,
    price: string
}

const OneYearBanner = ({discountPercent, price}: BannerProps) => {
    return (
        <>
            <PriceBannerText className="bg-[#2EBE65]">
                1 YEAR LOW
            </PriceBannerText>

            <DiscountDisplay discountPercent={discountPercent} className="text-[#2EBE65]"/>

            <div className="text-[#2EBE65] min-w-[70px] text-right">
                ${price}
            </div>
        </>
    )
    
}

const TwoYearBanner = ({discountPercent, price}: BannerProps) => {
    return (
        <>
            <PriceBannerText className="bg-[#59BCE6]">
                2 YEAR LOW
            </PriceBannerText>

            <DiscountDisplay discountPercent={discountPercent} className="text-[#59BCE6]"/>

            <div className="text-[#59BCE6] min-w-[70px] text-right">
                ${price}
            </div>
        </>
    )
}

const AllTimeBanner = ({discountPercent, price}: BannerProps) => {
    return (
        <>
            <PriceBannerText className="bg-[#F0585A]">
                LOWEST EVER
            </PriceBannerText>

            <DiscountDisplay discountPercent={discountPercent} className="text-[#F0585A]"/>

            <div className="text-[#F0585A] min-w-[70px] text-right">
                ${price}
            </div>
        </>
    )
}

const NoBanner = ({discountPercent, price}: BannerProps) => {

    const textStyle: string = discountPercent >= 50 ? 'text-[#2EBE65]' : ''

    return (
        <>
            <DiscountDisplay discountPercent={discountPercent} className={textStyle}/>
            <div className={'min-w-[70px] text-right ' + textStyle}>
                ${price}
            </div>
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
        return <NoBanner discountPercent={0} price={priceText} />
    

    if (!props.bannerType && props.discountPercent > 0) 
        return <NoBanner discountPercent={props.discountPercent} price={priceText} />
    

    switch(props.bannerType) {
        case 'one-year':
            return <OneYearBanner discountPercent={props.discountPercent} price={priceText} />
        case 'two-year':
            return <TwoYearBanner discountPercent={props.discountPercent} price={priceText} />
        case 'all-time':
            return <AllTimeBanner discountPercent={props.discountPercent} price={priceText} />
        default:
            return <NoBanner discountPercent={props.discountPercent} price={priceText} />
    }
}

export default PriceBanner