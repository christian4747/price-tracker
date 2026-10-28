import { getFormattedDateTimeString } from '@/utils/dateUtils'

interface AddedUpdatedText {
    createdAt: string
    updatedAt: string
    // Put each date on its own line, for narrow spaces like modal titles
    stacked?: boolean
    className?: string
}

// Spans only, so it can also sit inside headings, like a modal's title
export const AddedUpdatedText = ({ createdAt, updatedAt, stacked = false, className = '' }: AddedUpdatedText) => {
    const added = `Added ${getFormattedDateTimeString(createdAt)}`
    const lastUpdated = `Last updated ${getFormattedDateTimeString(updatedAt)}`

    return (
        <span className={`text-xs text-raincloud cursor-default ${className}`}>
            {stacked ? (
                <>
                    <span className="block">{added}</span>
                    <span className="block">{lastUpdated}</span>
                </>
            ) : (
                `${added} · ${lastUpdated}`
            )}
        </span>
    )
}
