import { Tooltip } from '@mantine/core'
import { MdArrowDownward, MdArrowForward, MdArrowUpward } from 'react-icons/md'
import type { PriceChange } from '@/utils/priceListUtils'

interface PriceChangeArrow {
    // How the price changed from the one before it, or nothing when it can't be compared
    change?: PriceChange
}

// Drops are what the list is watched for, so only they get a color. Rises stay gray, since red already means
// "Lowest ever" in the price banner.
const ARROWS = {
    down: { icon: <MdArrowDownward />, className: 'text-green-600' },
    up: { icon: <MdArrowUpward />, className: 'text-raincloud' },
    same: { icon: <MdArrowForward />, className: 'text-raincloud' }
}

/**
 * An arrow beside a price's amount for how it changed, with what changed on hover. The space is kept when there's no
 * arrow, so the amounts stay lined up.
 */
export const PriceChangeArrow = ({ change }: PriceChangeArrow) => {
    const arrow = change && ARROWS[change.direction]

    return (
        <span className="flex w-4 justify-center">
            {change && arrow && (
                <Tooltip withArrow label={change.label}>
                    <span role="img" aria-label={change.label} className={`flex ${arrow.className}`}>
                        {arrow.icon}
                    </span>
                </Tooltip>
            )}
        </span>
    )
}
