import { ActionIcon, Tooltip } from '@mantine/core'

interface IconAction {
    label: string
    icon: React.ReactNode
    onClick: () => void
    // Set on the actions that open a panel, so screen readers announce whether it's open
    expanded?: boolean
    loading?: boolean
    // Smaller in tight rows, such as the price list
    size?: 'sm' | 'md'
    // Round, for buttons inside rounded inputs such as the search box
    round?: boolean
}

// An icon that does something, such as editing or deleting. A real button rather than a clickable icon, so it can be
// reached with Tab and used with Enter or Space, with its label read out by screen readers and shown as a tooltip
export const IconAction = ({ label, icon, onClick, expanded, loading, size = 'md', round = false }: IconAction) => (
    <Tooltip withArrow label={label}>
        <ActionIcon
            variant="subtle"
            color="var(--color-raisin)"
            size={size}
            radius={round ? 'xl' : undefined}
            aria-label={label}
            aria-expanded={expanded}
            loading={loading}
            onClick={onClick}
        >
            {icon}
        </ActionIcon>
    </Tooltip>
)
