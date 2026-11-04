import type { PriceType } from '@/types/price'
import { Button, TextInput } from '@mantine/core'
import { useEditPrice } from '@/hooks/price/useEditPrice'
import { getFormattedDateTimeString } from '@/utils/dateUtils'
import { RecentDataScroller } from '@/components/common/RecentDataScroller'
import { SubmitButton } from '@/components/common/SubmitButton'
import { PriceDateTimePicker } from '@/components/price/PriceDateTimePicker'
import { useRecentPriceData } from '@/hooks/price/useRecentPriceData'
import { AmountInputGroup } from '@/components/price/AmountInputGroup'

interface EditPriceForm {
    price: PriceType
    // Passed separately because the API's prices leave out their product
    productId: number
    closeEditPrice: () => void
}

export const EditPriceForm = ({ price, productId, closeEditPrice }: EditPriceForm) => {
    // Hook for editing prices
    const { priceDTO, mutation } = useEditPrice(price, productId)
    // Hook for recent price data
    const { query: recentPriceQuery } = useRecentPriceData(productId)

    const recentDescriptions = recentPriceQuery.data?.descriptions.map((description: string, idx: number) => (
        <Button key={idx} onClick={() => priceDTO.setField('description', description)}>
            {description}
        </Button>
    ))

    const recentCurrencies = recentPriceQuery.data?.currencies.map((currency: string, idx: number) => (
        <Button key={idx} onClick={() => priceDTO.setField('currency', currency)}>
            {currency}
        </Button>
    ))

    const recentPricesStarted = recentPriceQuery.data?.pricesStarted.map((priceStarted: string, idx: number) => (
        <Button key={idx} onClick={() => priceDTO.setField('priceStarted', priceStarted)}>
            {getFormattedDateTimeString(priceStarted)}
        </Button>
    ))

    const finalizeEditPrice = (e: React.MouseEvent) => {
        mutation.mutate(undefined, { onSuccess: closeEditPrice })
        e.stopPropagation()
    }

    return (
        <>
            <AmountInputGroup
                value={priceDTO.value}
                setField={priceDTO.setField}
                baseAmounts={recentPriceQuery.data?.baseAmounts}
                discountPercentages={recentPriceQuery.data?.discountPercentages}
                returnPercentages={recentPriceQuery.data?.returnPercentages}
            />

            <TextInput
                label="Description"
                radius="xl"
                placeholder="Description"
                onChange={(e) => priceDTO.setField('description', e.target.value)}
                value={priceDTO.value.description}
                className="mb-2"
            />
            {!!recentDescriptions?.length && (
                <RecentDataScroller className="mb-2">{recentDescriptions}</RecentDataScroller>
            )}

            <TextInput
                label="Currency"
                radius="xl"
                placeholder="ex. USD"
                onChange={(e) => priceDTO.setField('currency', e.target.value)}
                value={priceDTO.value.currency}
                className="mb-2"
            />
            {!!recentCurrencies?.length && <RecentDataScroller className="mb-2">{recentCurrencies}</RecentDataScroller>}

            <PriceDateTimePicker
                label="Start Date"
                withAsterisk
                onChange={(priceStarted) => (priceStarted ? priceDTO.setField('priceStarted', priceStarted) : '')}
                value={priceDTO.value.priceStarted}
            />
            {!!recentPricesStarted?.length && (
                <RecentDataScroller className="mb-2">{recentPricesStarted}</RecentDataScroller>
            )}

            <SubmitButton pending={mutation.isPending} onClick={finalizeEditPrice}>
                Edit Price
            </SubmitButton>
        </>
    )
}
