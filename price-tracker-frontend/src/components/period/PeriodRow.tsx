import { Button, Collapse, Text } from '@mantine/core'
import { useState } from 'react'
import { MdDelete, MdDeleteForever, MdEdit, MdExpandLess, MdExpandMore, MdUndo } from 'react-icons/md'
import { IconAction } from '@/components/common/IconAction'
import { TitleSeparator } from '@/components/common/TitleSeparator'
import { PeriodForm } from './PeriodForm'
import { PeriodMatches } from './PeriodMatches'
import { useDeletePeriod } from '@/hooks/period/useDeletePeriod'
import { useRestorePeriod } from '@/hooks/period/useRestorePeriod'
import { usePermanentlyDeletePeriod } from '@/hooks/period/usePermanentlyDeletePeriod'
import { getFormattedDateRangeString } from '@/utils/dateUtils'
import type { PeriodKind, PeriodType } from '@/types/period'

const periodKindText: Record<PeriodKind, string> = {
    SALE: 'Sale',
    RETURN: 'Return'
}

// What opens below the row. Only one at a time, so the row never grows two panels
type RowPanel = 'none' | 'edit' | 'delete' | 'permanentlyDelete' | 'matches'

interface ConfirmPanel {
    text: string
    confirmText: string
    pending: boolean
    onConfirm: () => void
    onCancel: () => void
}

const ConfirmPanel = ({ text, confirmText, pending, onConfirm, onCancel }: ConfirmPanel) => (
    <div className="pt-2">
        {/* Boxed like the edit form, in a light shade of the red confirm button, since it leads to deleting */}
        <div className="rounded-md border border-(--mantine-color-red-3) p-3">
            <Text size="sm" mb={12}>
                {text}
            </Text>
            <div className="flex gap-2">
                <Button size="compact-sm" color="red.8" loading={pending} onClick={onConfirm}>
                    {confirmText}
                </Button>
                <Button size="compact-sm" variant="default" disabled={pending} onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </div>
    </div>
)

export const PeriodRow = ({ period }: { period: PeriodType }) => {
    const [panel, setPanel] = useState<RowPanel>('none')
    const togglePanel = (nextPanel: RowPanel) => setPanel(panel === nextPanel ? 'none' : nextPanel)
    const closePanel = () => setPanel('none')

    const { mutation: deleteMutation } = useDeletePeriod(period)
    const { mutation: restoreMutation } = useRestorePeriod(period)
    const { mutation: permanentlyDeleteMutation } = usePermanentlyDeletePeriod(period)

    const deleted = period.deletedAt !== null
    // Matches deleted products: only the name is struck through, since the store and type are already gray
    const deletedClassName = deleted ? 'line-through text-raincloud' : ''
    const storeText = period.store ?? 'All stores'

    return (
        // Named after the period, so the row can be found and read by its name alone. The line between rows is drawn on
        // top of the row's padding, not as a border, so a row keeps its height when rows appear or go away beside it.
        // The list animates rows that change size
        <li
            aria-label={period.name}
            className="relative py-2 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-smoke first:before:hidden"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
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
                </div>

                <div className="flex shrink-0 gap-1">
                    <IconAction
                        label="Edit period"
                        icon={<MdEdit />}
                        expanded={panel === 'edit'}
                        onClick={() => togglePanel('edit')}
                    />
                    {deleted ? (
                        <>
                            {/* Restores straight away, since it can be deleted again just as easily */}
                            <IconAction
                                label="Restore period"
                                icon={<MdUndo />}
                                loading={restoreMutation.isPending}
                                onClick={() => restoreMutation.mutate()}
                            />
                            <IconAction
                                label="Permanently delete period"
                                icon={<MdDeleteForever />}
                                expanded={panel === 'permanentlyDelete'}
                                onClick={() => togglePanel('permanentlyDelete')}
                            />
                        </>
                    ) : (
                        <IconAction
                            label="Delete period"
                            icon={<MdDelete />}
                            expanded={panel === 'delete'}
                            onClick={() => togglePanel('delete')}
                        />
                    )}
                    {/* Last, since it opens the period's details rather than changing the period */}
                    <IconAction
                        label="Show matching prices"
                        icon={panel === 'matches' ? <MdExpandLess /> : <MdExpandMore />}
                        expanded={panel === 'matches'}
                        onClick={() => togglePanel('matches')}
                    />
                </div>
            </div>

            {/* Each panel is removed once it finishes closing, so the edit form starts over each time it opens */}
            <Collapse expanded={panel === 'edit'} keepMounted={false}>
                <div className="pt-2">
                    <PeriodForm period={period} onSaved={closePanel} />
                </div>
            </Collapse>
            <Collapse expanded={panel === 'delete'} keepMounted={false}>
                <ConfirmPanel
                    text={`Delete ${period.name}? You can restore it with Show deleted.`}
                    confirmText="Delete"
                    pending={deleteMutation.isPending}
                    onConfirm={() => deleteMutation.mutate(undefined, { onSuccess: closePanel })}
                    onCancel={closePanel}
                />
            </Collapse>
            <Collapse expanded={panel === 'matches'} keepMounted={false}>
                <PeriodMatches period={period} />
            </Collapse>
            <Collapse expanded={panel === 'permanentlyDelete'} keepMounted={false}>
                <ConfirmPanel
                    text={`Permanently delete ${period.name}? This can't be undone.`}
                    confirmText="Permanently delete"
                    pending={permanentlyDeleteMutation.isPending}
                    onConfirm={() => permanentlyDeleteMutation.mutate(undefined, { onSuccess: closePanel })}
                    onCancel={closePanel}
                />
            </Collapse>
        </li>
    )
}
