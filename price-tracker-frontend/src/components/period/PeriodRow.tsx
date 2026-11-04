import { ActionIcon, Button, Collapse, Text, Tooltip } from '@mantine/core'
import { useState } from 'react'
import { MdDelete, MdDeleteForever, MdEdit, MdUndo } from 'react-icons/md'
import { TitleSeparator } from '@/components/common/TitleSeparator'
import { PeriodForm } from './PeriodForm'
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
type RowPanel = 'none' | 'edit' | 'delete' | 'permanentlyDelete'

interface RowAction {
    label: string
    icon: React.ReactNode
    onClick: () => void
    // Set on the actions that open a panel, so screen readers announce whether it's open
    expanded?: boolean
    loading?: boolean
}

// Real buttons rather than clickable icons, so they can be reached with the keyboard
const RowAction = ({ label, icon, onClick, expanded, loading }: RowAction) => (
    <Tooltip withArrow label={label}>
        <ActionIcon
            variant="subtle"
            color="var(--color-raisin)"
            aria-label={label}
            aria-expanded={expanded}
            loading={loading}
            onClick={onClick}
        >
            {icon}
        </ActionIcon>
    </Tooltip>
)

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
        // Named after the period, so the row can be found and read by its name alone
        <li aria-label={period.name} className="py-2">
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
                    <RowAction
                        label="Edit period"
                        icon={<MdEdit />}
                        expanded={panel === 'edit'}
                        onClick={() => togglePanel('edit')}
                    />
                    {deleted ? (
                        <>
                            {/* Restores straight away, since it can be deleted again just as easily */}
                            <RowAction
                                label="Restore period"
                                icon={<MdUndo />}
                                loading={restoreMutation.isPending}
                                onClick={() => restoreMutation.mutate()}
                            />
                            <RowAction
                                label="Permanently delete period"
                                icon={<MdDeleteForever />}
                                expanded={panel === 'permanentlyDelete'}
                                onClick={() => togglePanel('permanentlyDelete')}
                            />
                        </>
                    ) : (
                        <RowAction
                            label="Delete period"
                            icon={<MdDelete />}
                            expanded={panel === 'delete'}
                            onClick={() => togglePanel('delete')}
                        />
                    )}
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
