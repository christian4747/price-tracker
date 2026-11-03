import periodService from '@/services/periodService'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { PeriodType } from '@/types/period'

export function usePeriods(store?: string, showDeleted = false) {
    // Query for getting the periods that apply to a store, or every period when no store is given
    const periodsQuery = useQuery<PeriodType[]>({
        queryKey: ['periods', store, showDeleted],
        queryFn: () => {
            return periodService.getPeriods(store, showDeleted)
        },
        // Keeps the current list on screen while the list with or without deleted periods loads
        placeholderData: keepPreviousData,
        throwOnError: true
    })

    const usePeriodsProps = {
        query: periodsQuery
    }

    return usePeriodsProps
}
