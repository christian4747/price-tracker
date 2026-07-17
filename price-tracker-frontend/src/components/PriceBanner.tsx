type PriceBannerTextProps = {
    children: React.ReactNode,
    bannerColor: string
}

const PriceBannerText = ({children, bannerColor}: PriceBannerTextProps) => {
    return (
        <div className={`bg-[${bannerColor}] text-[#F4F4F4] rounded-sm p-2 font-mono font-bold min-w-[130px] flex justify-center`}>
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
    discountPercent: number
}

const OneYearBanner = ({discountPercent}: BannerProps) => {
    return (
        <>
            <PriceBannerText bannerColor="#2EBE65">
                1 YEAR LOW
            </PriceBannerText>

            <DiscountDisplay discountPercent={discountPercent} className="text-[#2EBE65]"/>
        </>
    )
    
}

const TwoYearBanner = ({discountPercent}: BannerProps) => {
    return (
        <>
            <PriceBannerText bannerColor="#59BCE6">
                2 YEAR LOW
            </PriceBannerText>

            <DiscountDisplay discountPercent={discountPercent} className="text-[#59BCE6]"/>
        </>
    )
}

const AllTimeBanner = ({discountPercent}: BannerProps) => {
    return (
        <>
            <PriceBannerText bannerColor="#F0585A">
                LOWEST EVER
            </PriceBannerText>

            <DiscountDisplay discountPercent={discountPercent} className="text-[#F0585A]"/>
        </>
    )
}

const NoBanner = ({discountPercent}: BannerProps) => {

    const textStyle: string = discountPercent >= 50 ? 'text-[#2EBE65]' : ''

    return (
        <DiscountDisplay discountPercent={discountPercent} className={textStyle}/>
    )
}

type PriceBannerProps = {
    bannerType?: 'one-year' | 'two-year' | 'all-time',
    discountPercent: number
}

const PriceBanner = (props: PriceBannerProps) => {
    if (!props.bannerType && props.discountPercent > 0) {
        return <NoBanner discountPercent={props.discountPercent} />
    }

    switch(props.bannerType) {
        case 'one-year':
            return <OneYearBanner discountPercent={props.discountPercent} />
        case 'two-year':
            return <TwoYearBanner discountPercent={props.discountPercent} />
        case 'all-time':
            return <AllTimeBanner discountPercent={props.discountPercent} />
        default:
            return <NoBanner discountPercent={props.discountPercent} />
    }
}

export default PriceBanner