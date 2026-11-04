import { describe, expect } from 'vitest'
import type { SetupWorker } from 'msw/browser'
import {
    createPeriod,
    createPrice,
    createProduct,
    renderWithClient,
    screen,
    test,
    userEvent,
    waitFor,
    within
} from '@/test-utils'
import { http, HttpResponse } from 'msw'
import type { MatchingPeriodPrice } from '@/types/period'
import { PeriodMatches } from './PeriodMatches'

const periodsApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/periods'

const blackFriday = createPeriod(5, { name: 'Black Friday' })

// Built from local times so the expected text doesn't depend on the test machine's time zone
const createMatch = (id: number, productName = 'Product ' + id): MatchingPeriodPrice => ({
    price: createPrice(id, {
        totalAmount: 4.99,
        priceStarted: new Date(2026, 10, 27, 0, 0).toISOString(),
        priceEnded: new Date(2026, 10, 29, 23, 59).toISOString()
    }),
    product: createProduct(id, { name: productName, store: 'Store 1' })
})

// A full page of matches, which means there may be more
const fullPage = (start: number) => Array.from({ length: 20 }, (_, idx) => createMatch(start + idx))

// Serves the given pages of matches in order, each with the total across all pages, and records the page and size
// each request asks for
const serveMatches = (worker: SetupWorker, pages: MatchingPeriodPrice[][], count = pages.flat().length) => {
    const requests: { periodId: string; page: string | null; size: string | null }[] = []
    worker.use(
        http.get(periodsApiUrl + '/:periodId/prices', ({ request, params }) => {
            const searchParams = new URL(request.url).searchParams
            const page = searchParams.get('page')
            requests.push({ periodId: params.periodId as string, page, size: searchParams.get('size') })
            return HttpResponse.json({ content: pages[Number(page)] ?? [], count })
        })
    )
    return requests
}

describe('PeriodMatches', () => {
    test("should ask for the first 20 of the period's matching prices", async ({ worker }) => {
        const requests = serveMatches(worker, [[createMatch(1)]])
        renderWithClient(<PeriodMatches period={blackFriday} />)

        await waitFor(() => expect(requests).toEqual([{ periodId: '5', page: '0', size: '20' }]))
    })

    test('should show the product, store, price, and dates of each match', async ({ worker }) => {
        serveMatches(worker, [[createMatch(1, 'Headphones')]])
        renderWithClient(<PeriodMatches period={blackFriday} />)

        const match = await screen.findByRole('listitem', { name: 'Headphones' })
        expect(within(match).getByText('Store 1')).toBeInTheDocument()
        expect(within(match).getByText('$4.99')).toBeInTheDocument()
        expect(within(match).getByText('Nov 27, 2026 12:00 AM to Nov 29, 2026 11:59 PM')).toBeInTheDocument()
    })

    test('should keep the order the backend sends', async ({ worker }) => {
        serveMatches(worker, [[createMatch(2, 'Newer'), createMatch(1, 'Older')]])
        renderWithClient(<PeriodMatches period={blackFriday} />)

        await screen.findByRole('listitem', { name: 'Older' })

        const names = screen.getAllByRole('listitem').map((match) => match.getAttribute('aria-label'))
        expect(names).toEqual(['Newer', 'Older'])
    })

    test('should explain when no prices match yet', async ({ worker }) => {
        serveMatches(worker, [[]])
        renderWithClient(<PeriodMatches period={blackFriday} />)

        expect(await screen.findByText('No prices match this period yet.')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument()
    })

    test('should not offer more when fewer than 20 match', async ({ worker }) => {
        serveMatches(worker, [[createMatch(1)]])
        renderWithClient(<PeriodMatches period={blackFriday} />)

        await screen.findByRole('listitem', { name: 'Product 1' })

        expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument()
        expect(screen.queryByText('No prices match this period yet.')).not.toBeInTheDocument()
    })

    test('should load the next 20 below the first, then stop offering more', async ({ worker }) => {
        const requests = serveMatches(worker, [fullPage(1), [createMatch(21)]])
        const user = userEvent.setup()
        renderWithClient(<PeriodMatches period={blackFriday} />)

        await user.click(await screen.findByRole('button', { name: 'Load more' }))

        expect(await screen.findByRole('listitem', { name: 'Product 21' })).toBeInTheDocument()
        expect(screen.getAllByRole('listitem')).toHaveLength(21)
        expect(requests.map((request) => request.page)).toEqual(['0', '1'])
        await waitFor(() => expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument())
    })

    test('should stop offering more once all of exactly 40 have loaded', async ({ worker }) => {
        const requests = serveMatches(worker, [fullPage(1), fullPage(21)])
        const user = userEvent.setup()
        renderWithClient(<PeriodMatches period={blackFriday} />)

        await user.click(await screen.findByRole('button', { name: 'Load more' }))

        expect(await screen.findByRole('listitem', { name: 'Product 40' })).toBeInTheDocument()
        await waitFor(() => expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument())
        expect(requests.map((request) => request.page)).toEqual(['0', '1'])
    })

    test('should stop offering more when a page comes back empty, even if the count says there are more', async ({
        worker
    }) => {
        // As if the count disagreed with the page, from a price added between the backend's page and count queries
        serveMatches(worker, [fullPage(1), []], 25)
        const user = userEvent.setup()
        renderWithClient(<PeriodMatches period={blackFriday} />)

        await user.click(await screen.findByRole('button', { name: 'Load more' }))

        await waitFor(() => expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument())
        expect(screen.getAllByRole('listitem')).toHaveLength(20)
    })
})
