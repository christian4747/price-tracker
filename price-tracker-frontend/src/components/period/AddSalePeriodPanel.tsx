import { Button, Collapse, Switch, Text, TextInput } from '@mantine/core'
import { useAddPeriod } from '@/hooks/period/useAddPeriod'
import { useId, useState } from 'react'
import { MdAdd, MdRemove } from 'react-icons/md'
import dayjs from 'dayjs'

interface AddSalePeriodPanel {
    store: string
    periodStarted: string
    periodEnded: string
    // True when the dates can't be saved, such as an end date before the start
    datesInvalid: boolean
}

// Saves the price form's dates as a named sale period, so they can be picked again for other prices
export const AddSalePeriodPanel = ({ store, periodStarted, periodEnded, datesInvalid }: AddSalePeriodPanel) => {
    const [opened, setOpened] = useState(false)
    const [name, setName] = useState('')
    const [allStores, setAllStores] = useState(false)
    // The message only shows after a save is tried, so the panel doesn't open with an error
    const [saveTried, setSaveTried] = useState(false)

    const storesTextId = useId()

    const { mutation } = useAddPeriod()

    const nameBlank = name.trim() === ''
    const nameError = saveTried && nameBlank ? 'Name is required' : undefined

    // Opening starts the panel over, so it never reopens with an old name. Closing leaves the values alone, so they
    // don't visibly clear while the panel slides closed
    const togglePanel = () => {
        if (!opened) {
            setName('')
            setAllStores(false)
            setSaveTried(false)
        }
        setOpened(!opened)
    }

    const savePeriod = () => {
        setSaveTried(true)
        if (nameBlank) return

        mutation.mutate(
            {
                name,
                type: 'SALE',
                // No store means the period applies to every store
                store: allStores ? null : store,
                periodStarted: dayjs(periodStarted).format(),
                periodEnded: dayjs(periodEnded).format()
            },
            // Opening it again starts it over
            { onSuccess: () => setOpened(false) }
        )
    }

    return (
        <>
            {/* A link color, since the theme's usual raisin makes a subtle button look like plain text. Shade 8 is
                given as a variable, since the subtle variant would use the lighter shade 6, too faint on white */}
            <Button
                variant="subtle"
                color="var(--mantine-color-blue-8)"
                size="compact-sm"
                className="mt-2"
                leftSection={opened ? <MdRemove /> : <MdAdd />}
                aria-expanded={opened}
                onClick={togglePanel}
            >
                Save these dates as a sale period
            </Button>
            {/* Removed once it finishes closing, so its hidden inputs don't stay in the page */}
            <Collapse expanded={opened} keepMounted={false}>
                {/* Padding rather than margins, since margins can escape the sliding box and make it jump at the end */}
                <div className="pt-1 pb-2">
                    <div className="rounded-md border border-smoke p-3">
                        <TextInput
                            label="Sale period name"
                            placeholder="ex. Black Friday"
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                            required
                            error={nameError}
                            className="mb-2"
                        />
                        <Switch
                            label="All stores"
                            aria-describedby={storesTextId}
                            checked={allStores}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAllStores(e.target.checked)}
                        />
                        {/* Its own element rather than the switch's description, since Mantine puts the description inside
                        the label, which would make the store text part of the switch's name */}
                        <Text id={storesTextId} size="xs" className="mt-1 text-raincloud">
                            {allStores ? 'For every store' : `Only for ${store}`}
                        </Text>
                        <Button
                            size="sm"
                            variant="light"
                            className="mt-3"
                            loading={mutation.isPending}
                            disabled={datesInvalid}
                            onClick={savePeriod}
                        >
                            Save sale period
                        </Button>
                    </div>
                </div>
            </Collapse>
        </>
    )
}
