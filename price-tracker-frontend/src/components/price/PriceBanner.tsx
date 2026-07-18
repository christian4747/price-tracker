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
                <div className={className}>
                    -{discountPercent}%
                </div>
                : <></>
            }
        </>
    )
}

type BannerProps = {
    discountPercent: number,
    price: number
}

const OneYearBanner = ({discountPercent, price}: BannerProps) => {
    return (
        <>
            <PriceBannerText className="bg-[#2EBE65]">
                1 YEAR LOW
            </PriceBannerText>

            <DiscountDisplay discountPercent={discountPercent} className="text-[#2EBE65]"/>

            <div className="text-[#2EBE65]">
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

            <div className="text-[#59BCE6]">
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

            <div className="text-[#F0585A]">
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
            <div className={textStyle}>
                ${price}
            </div>
        </>
    )
}

type PriceBannerProps = {
    bannerType?: 'one-year' | 'two-year' | 'all-time',
    discountPercent: number,
    price: number
}

const PriceBanner = (props: PriceBannerProps) => {
    if (!props.bannerType && props.discountPercent > 0) {
        return <NoBanner discountPercent={props.discountPercent} price={props.price} />
    }

    switch(props.bannerType) {
        case 'one-year':
            return <OneYearBanner discountPercent={props.discountPercent} price={props.price} />
        case 'two-year':
            return <TwoYearBanner discountPercent={props.discountPercent} price={props.price} />
        case 'all-time':
            return <AllTimeBanner discountPercent={props.discountPercent} price={props.price} />
        default:
            return <NoBanner discountPercent={props.discountPercent} price={props.price} />
    }
}

export default PriceBanner