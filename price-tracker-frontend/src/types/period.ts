// What a period is for: a sale, or a return, where purchases get cash or points back
export type PeriodKind = 'SALE' | 'RETURN'

export interface PeriodType {
    periodId: number
    name: string
    type: PeriodKind
    // No store means the period applies to every store
    store: string | null
    periodStarted: string
    periodEnded: string
    createdAt: string
    deletedAt: string | null
    updatedAt: string
}

// The details sent to the backend when saving a period
export interface PeriodDTO {
    name: string
    type: PeriodKind
    store: string | null
    periodStarted: string
    periodEnded: string
}
