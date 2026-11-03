import { Button, Center, Collapse, Switch, Text, TextInput } from '@mantine/core'
import type { ProductType } from '@/types/product'
import type { PricePeriod } from '@/types/price'
import type { PeriodType } from '@/types/period'
import { RecentDataScroller } from '@/components/common/RecentDataScroller'
import { SubmitButton } from '@/components/common/SubmitButton'
import { AddSalePeriodPanel } from '@/components/period/AddSalePeriodPanel'
import { PriceDateTimePicker } from '@/components/price/PriceDateTimePicker'
import { useEffect, useState } from 'react'
import { getFormattedDateRangeString, getFormattedDateTimeString } from '@/utils/dateUtils'
import { useDisclosure } from '@mantine/hooks'
import { useAddPrice } from '@/hooks/price/useAddPrice'
import { useRecentPriceData } from '@/hooks/price/useRecentPriceData'
import { usePeriods } from '@/hooks/period/usePeriods'
import { AmountInputGroup } from '@/components/price/AmountInputGroup'
import { getDiscountAmount, getReturnAmount } from '@/utils/priceUtils'
import dayjs from 'dayjs'

type DateOption = 'start' | 'range' | 'period'

interface AddPriceForm {
    product: ProductType
    setDateToday: (newVal: Date) => void
    close: () => void
    quickAdd?: boolean
}

export const AddPriceForm = ({ product, setDateToday, close, quickAdd = false }: AddPriceForm) => {
    // Track state of expanding the end date input
    const [expandEndDate, { open: openEndDate, close: closeEndDate }] = useDisclosure(false)
    // Track button group state for selecting start date, start + end date, or a sale period
    const [dateOption, setDateOption] = useState<DateOption>('start')
    // A sale period sets both dates, so it saves the same way as a start and end date
    const useEndDate = dateOption !== 'start'
    // Track state for adding desc to end date
    const [useEndDateDesc, setUseEndDateDesc] = useState(false)

    // Hook for adding prices
    const { priceDTO, mutation: multiMutation, singleMutation } = useAddPrice(product, useEndDateDesc)
    // Hook for recent price data
    const { query: recentPriceQuery } = useRecentPriceData(product.productId)
    // Hook for the named periods of the product's store, along with the ones for every store
    const { query: periodsQuery } = usePeriods(product.store)

    // Prefill quick add with the most recent price once recent price data loads
    const { setField } = priceDTO
    const recentPriceData = recentPriceQuery.data
    useEffect(() => {
        if (!quickAdd || !recentPriceData) return

        const amount = recentPriceData.baseAmounts[0]
        const discountPercentage = recentPriceData.discountPercentages[0]
        const returnPercentage = recentPriceData.returnPercentages[0]
        const discountAmount = getDiscountAmount(amount, discountPercentage)

        setField('amount', amount)
        setField('currency', recentPriceData.currencies[0])
        setField('discountPercentage', discountPercentage)
        setField('discountAmount', discountAmount)
        setField('priceEnded', recentPriceData.pricesEnded[0])
        setField('priceStarted', recentPriceData.pricesStarted[0])
        setField('returnPercentage', returnPercentage)
        setField('returnAmount', getReturnAmount(amount, discountAmount, returnPercentage))
    }, [quickAdd, recentPriceData, setField])

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

    const recentPricesEnded = recentPriceQuery.data?.pricesEnded.map((priceEnded: string, idx: number) => (
        <Button key={idx} onClick={() => priceDTO.setField('priceEnded', priceEnded)}>
            {getFormattedDateTimeString(priceEnded)}
        </Button>
    ))

    const setPeriodDates = (priceStarted: string, priceEnded: string) => {
        priceDTO.setField('priceStarted', priceStarted)
        priceDTO.setField('priceEnded', priceEnded)
    }

    // The backend lists current and upcoming periods first, so the order is kept
    const namedSalePeriods = (periodsQuery.data ?? [])
        .filter((period: PeriodType) => period.type === 'SALE')
        .map((period: PeriodType) => {
            const datesText = getFormattedDateRangeString(period.periodStarted, period.periodEnded)
            return (
                <Button
                    key={period.periodId}
                    // Read as one name, since screen readers would run the pieces together
                    aria-label={`${period.name}, ${datesText}`}
                    onClick={() => setPeriodDates(period.periodStarted, period.periodEnded)}
                >
                    <span className="flex gap-1.5">
                        <span title={period.name} className="max-w-40 truncate">
                            {period.name}
                        </span>
                        <span className="text-raincloud">·</span>
                        <span>{datesText}</span>
                    </span>
                </Button>
            )
        })

    const recentPricePeriods = recentPriceQuery.data?.pricePeriods?.map((period: PricePeriod, idx: number) => (
        <Button key={idx} onClick={() => setPeriodDates(period.priceStarted, period.priceEnded)}>
            {getFormattedDateRangeString(period.priceStarted, period.priceEnded)}
        </Button>
    ))

    const chooseDateOption = (option: DateOption) => {
        setDateOption(option)
        if (option === 'start') {
            closeEndDate()
        } else {
            openEndDate()
        }
    }

    // The end date only applies when adding a start and end date
    const endDateError =
        useEndDate && !dayjs(priceDTO.value.priceEnded).isAfter(priceDTO.value.priceStarted)
            ? 'End date must be after the start date'
            : undefined

    const finalizeAddPrice = () => {
        if (endDateError) return

        const onSuccess = () => {
            close()
            setDateToday(new Date())
        }

        if (useEndDate) {
            multiMutation.mutate(undefined, { onSuccess })
        } else {
            singleMutation.mutate(undefined, { onSuccess })
        }
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
            {recentDescriptions?.length > 0 && (
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
            {recentCurrencies?.length > 0 && (
                <RecentDataScroller className="mb-2">{recentCurrencies}</RecentDataScroller>
            )}

            <Center>
                {/* Narrower padding than usual, so all three buttons fit the modal's width */}
                <Button.Group>
                    <Button
                        px="sm"
                        variant={dateOption === 'start' ? 'filled' : 'default'}
                        onClick={() => chooseDateOption('start')}
                    >
                        Start Date Only
                    </Button>
                    <Button
                        px="sm"
                        variant={dateOption === 'range' ? 'filled' : 'default'}
                        onClick={() => chooseDateOption('range')}
                    >
                        Start and End Date
                    </Button>
                    <Button
                        px="sm"
                        variant={dateOption === 'period' ? 'filled' : 'default'}
                        onClick={() => chooseDateOption('period')}
                    >
                        Sale Period
                    </Button>
                </Button.Group>
            </Center>

            {/* Slides open and closed like the end date, and is removed once closed */}
            <Collapse expanded={dateOption === 'period'} keepMounted={false}>
                {namedSalePeriods.length > 0 && (
                    <RecentDataScroller className="mt-2">{namedSalePeriods}</RecentDataScroller>
                )}
                {recentPricePeriods?.length > 0 && (
                    <RecentDataScroller className="mt-2">{recentPricePeriods}</RecentDataScroller>
                )}
                {namedSalePeriods.length === 0 && !recentPricePeriods?.length && (
                    <Text size="sm" className="mt-2 text-raincloud">
                        No sale periods yet. Enter the dates below.
                    </Text>
                )}
            </Collapse>

            <PriceDateTimePicker
                label="Start Date"
                withAsterisk
                onChange={(priceStarted) => (priceStarted ? priceDTO.setField('priceStarted', priceStarted) : '')}
                value={priceDTO.value.priceStarted}
            />
            {recentPricesStarted?.length > 0 && (
                <RecentDataScroller className="mb-2">{recentPricesStarted}</RecentDataScroller>
            )}

            <Collapse expanded={expandEndDate}>
                <PriceDateTimePicker
                    label="End Date"
                    error={endDateError}
                    onChange={(priceEnded) => (priceEnded ? priceDTO.setField('priceEnded', priceEnded) : '')}
                    value={priceDTO.value.priceEnded}
                />
                {recentPricesEnded?.length > 0 && (
                    <RecentDataScroller className="mb-2">{recentPricesEnded}</RecentDataScroller>
                )}

                <Switch
                    label="Use same description for end date"
                    checked={useEndDateDesc}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setUseEndDateDesc(e.target.checked)
                    }}
                />
            </Collapse>

            {/* Below the dates, since it saves the dates shown above it. Removed once closed, so choosing Sale Period
                again starts it over */}
            <Collapse expanded={dateOption === 'period'} keepMounted={false}>
                <AddSalePeriodPanel
                    store={product.store}
                    periodStarted={priceDTO.value.priceStarted}
                    periodEnded={priceDTO.value.priceEnded}
                    datesInvalid={!!endDateError}
                />
            </Collapse>

            <SubmitButton
                pending={multiMutation.isPending || singleMutation.isPending}
                disabled={!!endDateError}
                onClick={finalizeAddPrice}
            >
                Add Price
            </SubmitButton>
        </>
    )
}
