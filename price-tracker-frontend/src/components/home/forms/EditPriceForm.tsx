import type { PriceType } from "../../../utils/Types"
import { Button, TextInput } from "@mantine/core"
import { useEditPrice } from "@/hooks/price/useEditPrice"
import { getFormattedDateString } from "@/utils/DateUtilities"
import { RecentDataScroller } from "@/components/common/RecentDataScroller"
import { PriceDateTimePicker } from "../price/PriceDateTimePicker"
import { useRecentPriceData } from "@/hooks/price/useRecentPriceData"
import { AmountInputGroup } from "../price/AmountInputGroup"

interface EditPriceForm {
    price: PriceType
    closeEditPrice: () => void
}

export const EditPriceForm = ({ price, closeEditPrice }: EditPriceForm) => {

    // Hook for editing prices
    const { priceDTO, mutation } = useEditPrice(price)
    // Hook for recent price data
    const { query: recentPriceQuery } = useRecentPriceData()

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
            {getFormattedDateString(priceStarted)}
        </Button>
    ))

    const finalizeEditPrice = (e: React.MouseEvent) => {
        mutation.mutate()
        closeEditPrice()
        e.stopPropagation()
    }

    return (
        <>
            <AmountInputGroup value={priceDTO.value} setField={priceDTO.setField} />

            <TextInput
                label="Description"
                radius='xl'
                placeholder="Description"
                onChange={(e) => priceDTO.setField('description', e.target.value)}
                value={priceDTO.value.description}
                className="mb-2"
            />
            {recentDescriptions?.length > 0 && <RecentDataScroller className='mb-2'>{recentDescriptions}</RecentDataScroller>}

            <TextInput
                label="Currency"
                radius='xl'
                placeholder="ex. USD"
                onChange={(e) => priceDTO.setField('currency', e.target.value)}
                value={priceDTO.value.currency}
                className="mb-2"
            />
            {recentCurrencies?.length > 0 && <RecentDataScroller className='mb-2'>{recentCurrencies}</RecentDataScroller>}

            <PriceDateTimePicker
                label='Start Date'
                withAsterisk
                onChange={(priceStarted) => priceStarted ? priceDTO.setField('priceStarted', priceStarted) : ''}
                value={priceDTO.value.priceStarted}
            />
            {recentPricesStarted?.length > 0 && <RecentDataScroller className='mb-2'>{recentPricesStarted}</RecentDataScroller>}

            <Button fullWidth className="mt-5" onClick={finalizeEditPrice}>Edit Price</Button>
        </>
    )
}