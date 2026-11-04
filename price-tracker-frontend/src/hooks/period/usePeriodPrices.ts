import periodService from '@/services/periodService'
import { useInfiniteQuery } from '@tanstack/react-query'
import type { MatchingPeriodPrice } from '@/types/period'

// The backend's page size for matching prices
export const PERIOD_PRICES_PAGE_SIZE = 20

export function usePeriodPrices(periodId: number) {
    // Loads the matching prices a page at a time. Under the periods key, so editing a period's dates reloads them
    const periodPricesQuery = useInfiniteQuery({
        queryKey: ['periods', periodId, 'prices'],
        queryFn: ({ pageParam }) => {
            return periodService.getPeriodPrices(periodId, pageParam, PERIOD_PRICES_PAGE_SIZE)
        },
        initialPageParam: 0,
        // The backend sends no total, so a full page means there may be more
        getNextPageParam: (lastPage: MatchingPeriodPrice[], allPages) =>
            lastPage.length === PERIOD_PRICES_PAGE_SIZE ? allPages.length : undefined,
        throwOnError: true
    })

    const usePeriodPricesProps = {
        query: periodPricesQuery
    }

    return usePeriodPricesProps
}
