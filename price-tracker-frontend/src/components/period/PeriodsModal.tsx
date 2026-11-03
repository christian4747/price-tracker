import { Button, Collapse, Modal, Switch, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useState } from 'react'
import { MdAdd, MdRemove } from 'react-icons/md'
import { AddPeriodForm } from './AddPeriodForm'
import { usePeriods } from '@/hooks/period/usePeriods'
import { TitleSeparator } from '@/components/common/TitleSeparator'
import { getFormattedDateRangeString } from '@/utils/dateUtils'
import type { PeriodKind, PeriodType } from '@/types/period'

const periodKindText: Record<PeriodKind, string> = {
    SALE: 'Sale',
    RETURN: 'Return'
}

const PeriodRow = ({ period }: { period: PeriodType }) => {
    // Matches deleted products: only the name is struck through, since the store and type are already gray
    const deletedClassName = period.deletedAt !== null ? 'line-through text-raincloud' : ''
    const storeText = period.store ?? 'All stores'

    return (
        // Named after the period, so the row can be found and read by its name alone
        <li aria-label={period.name} className="py-2">
            <div className="flex gap-1.5 items-baseline">
                <span title={period.name} className={`max-w-60 truncate ${deletedClassName}`}>
                    {period.name}
                </span>
                <TitleSeparator />
                <span title={storeText} className="max-w-40 truncate text-raincloud">
                    {storeText}
                </span>
                <TitleSeparator />
                <span className="text-raincloud">{periodKindText[period.type]}</span>
            </div>
            <Text size="sm" className="text-raincloud">
                {getFormattedDateRangeString(period.periodStarted, period.periodEnded)}
            </Text>
        </li>
    )
}

// Only rendered while the modal is open, so the periods load when it opens
const PeriodList = () => {
    const [showDeleted, setShowDeleted] = useState(false)
    const [adding, { toggle: toggleAdding, close: closeAdding }] = useDisclosure(false)
    const { query: periodsQuery } = usePeriods(undefined, showDeleted)

    return (
        <>
            <div className="flex items-center justify-between mb-2">
                {/* A link color, like the sale period toggle in the price form */}
                <Button
                    variant="subtle"
                    color="var(--mantine-color-blue-8)"
                    size="compact-sm"
                    leftSection={adding ? <MdRemove /> : <MdAdd />}
                    aria-expanded={adding}
                    onClick={toggleAdding}
                >
                    Add period
                </Button>
                <Switch
                    label="Show deleted"
                    checked={showDeleted}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowDeleted(e.target.checked)}
                />
            </div>
            {/* Removed once it finishes closing, so the form starts over each time it opens */}
            <Collapse expanded={adding} keepMounted={false}>
                <AddPeriodForm onSaved={closeAdding} />
            </Collapse>
            {periodsQuery.data?.length === 0 && (
                <Text size="sm" className="text-raincloud">
                    No periods yet.
                </Text>
            )}
            {/* The backend lists current and upcoming periods first, so the order is kept */}
            <ul className="divide-y divide-smoke">
                {periodsQuery.data?.map((period: PeriodType) => (
                    <PeriodRow key={period.periodId} period={period} />
                ))}
            </ul>
        </>
    )
}

// The Periods button and the modal it opens, which lists the named periods of every store
export const PeriodsModal = () => {
    const [opened, { open, close }] = useDisclosure(false)

    return (
        <>
            <Modal opened={opened} onClose={close} title="Periods" size="lg">
                <PeriodList />
            </Modal>
            <Button onClick={open}>Periods</Button>
        </>
    )
}
