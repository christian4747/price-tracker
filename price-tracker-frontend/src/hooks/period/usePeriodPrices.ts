import periodService from '@/services/periodService'
import { useInfiniteQuery } from '@tanstack/react-query'
import type { MatchingPeriodPrice } from '@/types/period'
import type { ResponseAndCount } from '@/types/response'

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
        // Returns the next page to ask for, or undefined when there are no more. Pages are numbered from 0, so after 2
        // pages have loaded (0 and 1), the next is page 2. There are more while the pages asked for so far can't hold
        // every match. Only the last page can be short, so a short or empty page always ends it
        getNextPageParam: (lastPage: ResponseAndCount<MatchingPeriodPrice>, allPages) =>
            allPages.length * PERIOD_PRICES_PAGE_SIZE < lastPage.count ? allPages.length : undefined,
        throwOnError: true
    })

    const usePeriodPricesProps = {
        query: periodPricesQuery
    }

    return usePeriodPricesProps
}
