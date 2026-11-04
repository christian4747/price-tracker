import { Button, Collapse, Modal, Switch, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useState } from 'react'
import { MdAdd, MdRemove } from 'react-icons/md'
import { PeriodForm } from './PeriodForm'
import { useAnimatedList } from '@/hooks/common/useAnimatedList'
import { usePeriods } from '@/hooks/period/usePeriods'
import { PeriodRow } from './PeriodRow'
import type { PeriodType } from '@/types/period'

// Only rendered while the modal is open, so the periods load when it opens
const PeriodList = () => {
    const [showDeleted, setShowDeleted] = useState(false)
    const [adding, { toggle: toggleAdding, close: closeAdding }] = useDisclosure(false)
    const { query: periodsQuery } = usePeriods(undefined, showDeleted)
    // Slides rows in and out as the list changes, such as deleted periods appearing with Show deleted
    const listRef = useAnimatedList<HTMLUListElement>()

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
                <PeriodForm onSaved={closeAdding} />
            </Collapse>
            {periodsQuery.data?.length === 0 && (
                <Text size="sm" className="text-raincloud">
                    No periods yet.
                </Text>
            )}
            {/* The backend lists current and upcoming periods first, so the order is kept */}
            <ul ref={listRef}>
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
