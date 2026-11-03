import type { PeriodType } from '@/types/period'

// Creates a test period, where changes replace only the values a test depends on
// Dates are built from local times so displayed text doesn't depend on the test machine's time zone
export const createPeriod = (periodId: number, changes: Partial<PeriodType> = {}): PeriodType => ({
    periodId,
    name: 'Period ' + periodId,
    type: 'SALE',
    store: null,
    periodStarted: new Date(2026, 10, 27, 0, 0).toISOString(),
    periodEnded: new Date(2026, 10, 30, 23, 59).toISOString(),
    createdAt: new Date(2026, 8, 4, 12).toISOString(),
    deletedAt: null,
    updatedAt: new Date(2026, 8, 4, 12).toISOString(),
    ...changes
})
