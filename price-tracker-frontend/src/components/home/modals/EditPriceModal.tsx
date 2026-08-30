import type { PriceType } from "../../../utils/Types"
import { Button, Modal, TextInput } from "@mantine/core"
import { useEditPrice } from "@/hooks/price/useEditPrice"
import PriceNumberInput from "../price/PriceNumberInput"
import PriceCalculator from "../price/PriceCalculator"
import { getFormattedDateString } from "@/utils/DateUtilities"
import { RecentDataScroller } from "@/components/common/RecentDataScroller"
import { PriceDateTimePicker } from "../price/PriceDateTimePicker"
import { useRecentPriceData } from "@/hooks/price/useRecentPriceData"

interface EditPriceModal {
    price: PriceType
    closeEditPrice: () => void
    opened: boolean
}

export const EditPriceModal = ({ price, closeEditPrice, opened }: EditPriceModal) => {

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

    return (
        <>
            <Modal
                opened={opened}
                onClose={closeEditPrice}
                title="Edit Price"
            >
                <PriceCalculator />
                <PriceNumberInput
                    label="Price"
                    className="mb-2 min-w-75"
                    withAsterisk
                    value={priceDTO.value.amount}
                    onChange={(amount) => {
                        amount ? priceDTO.setField('amount', amount) : priceDTO.setField('amount', 0); priceDTO.setField('returnAmount', 0)
                    }}
                />
                
                <PriceNumberInput
                    label="Return Amount"
                    className="mb-2"
                    value={priceDTO.value.returnAmount}
                    max={priceDTO.value.amount}
                    onChange={(returnAmount) => priceDTO.setField('returnAmount', returnAmount)}
                />

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
                {/* Race condition exists with closing modal, sometimes leaves overlay */}
                <Button fullWidth className="mt-5" onClick={(e) => { mutation.mutate(); closeEditPrice(); e.stopPropagation() }}>Edit Price</Button>
            </Modal>
        </>
    )
}