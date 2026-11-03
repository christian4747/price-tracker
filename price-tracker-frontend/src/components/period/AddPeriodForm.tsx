import { Button, Collapse, Input, SegmentedControl, Switch, TextInput } from '@mantine/core'
import { useState } from 'react'
import dayjs from 'dayjs'
import { useAddPeriod } from '@/hooks/period/useAddPeriod'
import { useRecentStores } from '@/hooks/product/useRecentStores'
import { RecentDataScroller } from '@/components/common/RecentDataScroller'
import { SubmitButton } from '@/components/common/SubmitButton'
import { PriceDateTimePicker } from '@/components/price/PriceDateTimePicker'
import { getLocalDateFromUTC } from '@/utils/dateUtils'
import type { PeriodKind } from '@/types/period'

const isBlank = (value: string) => value.trim() === ''

interface AddPeriodForm {
    onSaved: () => void
}

// Adds a named sale or return period. Only rendered while open, so each opening starts with empty values
export const AddPeriodForm = ({ onSaved }: AddPeriodForm) => {
    const [name, setName] = useState('')
    const [type, setType] = useState<PeriodKind>('SALE')
    const [allStores, setAllStores] = useState(false)
    const [store, setStore] = useState('')
    // Starts now and ends at the end of today, so the range starts out valid
    const [periodStarted, setPeriodStarted] = useState(() => getLocalDateFromUTC(new Date()).second(0).format())
    const [periodEnded, setPeriodEnded] = useState(() =>
        getLocalDateFromUTC(new Date()).endOf('day').second(0).format()
    )
    // Messages only show after a save is tried, so the form doesn't open with errors
    const [saveTried, setSaveTried] = useState(false)

    const { mutation } = useAddPeriod()
    const { query: recentStoresQuery } = useRecentStores()

    const nameError = saveTried && isBlank(name) ? 'Name is required' : undefined
    // A period for all stores has no store to ask for
    const storeError = saveTried && !allStores && isBlank(store) ? 'Store is required' : undefined
    const endDateError = !dayjs(periodEnded).isAfter(periodStarted)
        ? 'End date must be after the start date'
        : undefined

    const recentStores = recentStoresQuery.data?.map((recentStore: string, idx: number) => (
        <Button key={idx} onClick={() => setStore(recentStore)}>
            {recentStore}
        </Button>
    ))

    const savePeriod = () => {
        setSaveTried(true)
        if (isBlank(name) || (!allStores && isBlank(store))) return

        mutation.mutate(
            {
                name,
                type,
                // No store means the period applies to every store
                store: allStores ? null : store,
                periodStarted: dayjs(periodStarted).format(),
                periodEnded: dayjs(periodEnded).format()
            },
            { onSuccess: onSaved }
        )
    }

    return (
        // A lighter shade of the Add period button's blue, so the form reads as opened from it
        <div className="mb-3 rounded-md border border-(--mantine-color-blue-3) p-3">
            <TextInput
                label="Name"
                placeholder="ex. Black Friday"
                onChange={(e) => setName(e.target.value)}
                value={name}
                required
                error={nameError}
                className="mb-2"
            />

            <Input.Wrapper label="Type" className="mb-2">
                <SegmentedControl
                    fullWidth
                    radius="xl"
                    value={type}
                    onChange={(value) => setType(value as PeriodKind)}
                    data={[
                        { label: 'Sale', value: 'SALE' },
                        { label: 'Return', value: 'RETURN' }
                    ]}
                />
            </Input.Wrapper>

            <Switch
                label="All stores"
                checked={allStores}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAllStores(e.target.checked)}
                className="mb-2"
            />
            {/* Slides like the price form's end date, and is removed once closed. The typed store is kept, so
                switching All stores back off brings it back */}
            <Collapse expanded={!allStores} keepMounted={false}>
                <TextInput
                    label="Store"
                    placeholder="Store"
                    onChange={(e) => setStore(e.target.value)}
                    value={store}
                    required
                    error={storeError}
                    className="mb-2"
                />
                {recentStores && recentStores.length > 0 && (
                    <RecentDataScroller className="mb-2">{recentStores}</RecentDataScroller>
                )}
            </Collapse>

            <PriceDateTimePicker
                label="Start Date"
                withAsterisk
                onChange={(started) => (started ? setPeriodStarted(started) : '')}
                value={periodStarted}
            />
            <PriceDateTimePicker
                label="End Date"
                withAsterisk
                error={endDateError}
                onChange={(ended) => (ended ? setPeriodEnded(ended) : '')}
                value={periodEnded}
            />

            <SubmitButton pending={mutation.isPending} disabled={!!endDateError} onClick={savePeriod}>
                Save period
            </SubmitButton>
        </div>
    )
}
