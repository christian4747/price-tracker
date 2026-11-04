import { Button, Text } from '@mantine/core'
import { TitleSeparator } from '@/components/common/TitleSeparator'
import { usePeriodPrices } from '@/hooks/period/usePeriodPrices'
import { getFormattedDateRangeString } from '@/utils/dateUtils'
import { getPriceString } from '@/utils/priceUtils'
import type { MatchingPeriodPrice, PeriodType } from '@/types/period'

const MatchRow = ({ match }: { match: MatchingPeriodPrice }) => {
    const { price, product } = match

    return (
        // Named after the product, so the match can be found and read by its name alone
        <li aria-label={product.name} className="py-1.5">
            <div className="flex items-baseline justify-between gap-2">
                <div className="flex min-w-0 gap-1.5 items-baseline">
                    <span title={product.name} className="max-w-60 truncate">
                        {product.name}
                    </span>
                    <TitleSeparator />
                    <span title={product.store} className="max-w-40 truncate text-raincloud">
                        {product.store}
                    </span>
                </div>
                <span className="shrink-0">{getPriceString(price)}</span>
            </div>
            <Text size="sm" className="text-raincloud">
                {getFormattedDateRangeString(price.priceStarted, price.priceEnded)}
            </Text>
        </li>
    )
}

// The prices that fall within a period, newest start first, loaded 20 at a time
export const PeriodMatches = ({ period }: { period: PeriodType }) => {
    const { query } = usePeriodPrices(period.periodId)
    const matches = query.data?.pages.flat() ?? []

    return (
        // Light gray, so the matches read as details of the period above rather than more periods
        <div className="mt-2 rounded-md bg-cloud px-3 py-2">
            {query.isSuccess && matches.length === 0 && (
                <Text size="sm" className="text-raincloud">
                    No prices match this period yet.
                </Text>
            )}
            <ul className="divide-y divide-smoke">
                {matches.map((match) => (
                    <MatchRow key={match.price.priceId} match={match} />
                ))}
            </ul>
            {query.hasNextPage && (
                <Button
                    variant="subtle"
                    color="var(--mantine-color-blue-8)"
                    size="compact-sm"
                    mt={4}
                    loading={query.isFetchingNextPage}
                    onClick={() => query.fetchNextPage()}
                >
                    Load more
                </Button>
            )}
        </div>
    )
}
