import periodService from '@/services/periodService'
import { useQuery } from '@tanstack/react-query'
import type { PeriodType } from '@/types/period'

export function usePeriods(store: string) {
    // Query for getting the periods that apply to a store
    const periodsQuery = useQuery<PeriodType[]>({
        queryKey: ['periods', store],
        queryFn: () => {
            return periodService.getPeriods(store)
        },
        throwOnError: true
    })

    const usePeriodsProps = {
        query: periodsQuery
    }

    return usePeriodsProps
}
