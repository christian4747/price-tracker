import { Button, Collapse, Input, SegmentedControl, Switch, TextInput } from '@mantine/core'
import { useState } from 'react'
import dayjs from 'dayjs'
import { useAddPeriod } from '@/hooks/period/useAddPeriod'
import { useEditPeriod } from '@/hooks/period/useEditPeriod'
import { useRecentStores } from '@/hooks/product/useRecentStores'
import { RecentDataScroller } from '@/components/common/RecentDataScroller'
import { SubmitButton } from '@/components/common/SubmitButton'
import { PriceDateTimePicker } from '@/components/price/PriceDateTimePicker'
import { getLocalDateFromUTC } from '@/utils/dateUtils'
import type { PeriodDTO, PeriodKind, PeriodType } from '@/types/period'

const isBlank = (value: string) => value.trim() === ''

interface PeriodFields {
    // The period being edited, or nothing when adding one
    period?: PeriodType
    submitText: string
    pending: boolean
    onSubmit: (periodDTO: PeriodDTO) => void
}

// The fields of a period, with the checks that run before it's saved
const PeriodFields = ({ period, submitText, pending, onSubmit }: PeriodFields) => {
    const [name, setName] = useState(period?.name ?? '')
    const [type, setType] = useState<PeriodKind>(period?.type ?? 'SALE')
    const [allStores, setAllStores] = useState(period ? period.store === null : false)
    const [store, setStore] = useState(period?.store ?? '')
    // A new period starts now and ends at the end of today, so the range starts out valid
    const [periodStarted, setPeriodStarted] = useState(() =>
        period ? dayjs(period.periodStarted).format() : getLocalDateFromUTC(new Date()).second(0).format()
    )
    const [periodEnded, setPeriodEnded] = useState(() =>
        period ? dayjs(period.periodEnded).format() : getLocalDateFromUTC(new Date()).endOf('day').second(0).format()
    )
    // Messages only show after a save is tried, so the form doesn't open with errors
    const [saveTried, setSaveTried] = useState(false)

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

        onSubmit({
            name,
            type,
            // No store means the period applies to every store
            store: allStores ? null : store,
            periodStarted: dayjs(periodStarted).format(),
            periodEnded: dayjs(periodEnded).format()
        })
    }

    return (
        // A light blue border, like the price form's sale period panel, so it reads as opened from a blue toggle
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

            <SubmitButton pending={pending} disabled={!!endDateError} onClick={savePeriod}>
                {submitText}
            </SubmitButton>
        </div>
    )
}

interface SavedForm {
    onSaved: () => void
}

const AddPeriodFields = ({ onSaved }: SavedForm) => {
    const { mutation } = useAddPeriod()

    return (
        <PeriodFields
            submitText="Save period"
            pending={mutation.isPending}
            onSubmit={(periodDTO) => mutation.mutate(periodDTO, { onSuccess: onSaved })}
        />
    )
}

const EditPeriodFields = ({ period, onSaved }: SavedForm & { period: PeriodType }) => {
    const { mutation } = useEditPeriod(period)

    return (
        <PeriodFields
            period={period}
            submitText="Save changes"
            pending={mutation.isPending}
            onSubmit={(periodDTO) => mutation.mutate(periodDTO, { onSuccess: onSaved })}
        />
    )
}

interface PeriodForm {
    // The period to edit, or nothing to add a new one
    period?: PeriodType
    onSaved: () => void
}

// Adds a named sale or return period, or edits one. Only rendered while open, so each opening starts over
export const PeriodForm = ({ period, onSaved }: PeriodForm) => {
    // Split in two, since each needs its own hook and hooks can't be called only some of the time
    return period ? <EditPeriodFields period={period} onSaved={onSaved} /> : <AddPeriodFields onSaved={onSaved} />
}
