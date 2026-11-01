import type { ComponentProps } from 'react'
import { describe, expect, vi } from 'vitest'
import { createPrice, renderWithClient, screen, test, userEvent, waitFor } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import type { PriceType } from '@/types/price'
import { Price } from './Price'
import { getPriceString } from '@/utils/priceUtils'

const pricesApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/prices'

const price = createPrice(1)
const deletedPrice = createPrice(1, { deletedAt: '2026-09-06T00:00:00.000Z' })

// Renders the price with modal handlers that do nothing, unless a test passes its own
const renderPrice = (priceToRender: PriceType, handlers: Partial<ComponentProps<typeof Price>> = {}) => {
    return renderWithClient(
        <Price
            price={priceToRender}
            openEditPriceModal={() => {}}
            openDeletePriceModal={() => {}}
            openPermanentlyDeletePriceModal={() => {}}
            {...handlers}
        />
    )
}

describe('Price Component', () => {
    test('should render price', async () => {
        renderPrice(price)

        const price1Date = await screen.findByText('9/4/2026')
        await expect.element(price1Date).toBeInTheDocument()
    })

    test('should render delete price button', async () => {
        renderPrice(price)

        const deletePriceButton = screen.getByRole('img', { name: /delete price/i })
        await expect.element(deletePriceButton).toBeInTheDocument()
    })

    test('should not render delete price button', async () => {
        renderPrice(deletedPrice)

        const deletePriceButton = screen.queryByRole('img', { name: 'Delete price' })
        await expect.element(deletePriceButton).not.toBeInTheDocument()
    })

    test('should not render restore price button', async () => {
        renderPrice(price)

        const restorePriceButton = screen.queryByRole('img', { name: /restore price/i })
        await expect.element(restorePriceButton).not.toBeInTheDocument()
    })

    test('should restore a deleted price', async ({ worker }) => {
        const restoredPriceIds: string[] = []
        worker.use(
            http.put(pricesApiUrl + '/:priceId/restore', ({ params }) => {
                restoredPriceIds.push(params.priceId as string)
                return HttpResponse.json({ ...deletedPrice, deletedAt: null })
            })
        )
        const user = userEvent.setup()
        renderPrice(deletedPrice)

        await user.click(screen.getByRole('img', { name: /restore price/i }))

        await waitFor(() => expect(restoredPriceIds).toEqual(['1']))
    })

    test('should show the restore in progress and ignore clicks until it finishes', async ({ worker }) => {
        let requestCount = 0
        let finishRestore = () => {}
        const restoreFinished = new Promise<void>((resolve) => (finishRestore = resolve))
        worker.use(
            http.put(pricesApiUrl + '/:priceId/restore', async () => {
                requestCount++
                await restoreFinished
                return HttpResponse.json({ ...deletedPrice, deletedAt: null })
            })
        )
        const user = userEvent.setup()
        renderPrice(deletedPrice)

        const restoreButton = screen.getByRole('img', { name: /restore price/i })
        await user.click(restoreButton)

        await waitFor(() => expect(restoreButton.querySelector('.mantine-Loader-root')).toBeInTheDocument())
        await user.click(restoreButton)

        finishRestore()

        await waitFor(() => expect(restoreButton.querySelector('.mantine-Loader-root')).not.toBeInTheDocument())
        expect(requestCount).toBe(1)
    })

    test('should not render permanently delete price button for a price that is not deleted', async () => {
        renderPrice(price)

        expect(screen.queryByRole('img', { name: 'Permanently delete price' })).not.toBeInTheDocument()
    })

    test('should open the permanently delete modal for a deleted price', async () => {
        const openPermanentlyDeletePriceModal = vi.fn()
        const user = userEvent.setup()
        renderPrice(deletedPrice, { openPermanentlyDeletePriceModal })

        await user.click(screen.getByRole('img', { name: 'Permanently delete price' }))

        expect(openPermanentlyDeletePriceModal).toHaveBeenCalledWith(deletedPrice)
    })

    test('should strike through and gray out the date and amount of a deleted price', async () => {
        renderPrice(deletedPrice)

        await expect.element(screen.getByText('9/4/2026')).toHaveClass('line-through', 'text-raincloud')
        await expect
            .element(screen.getByText(getPriceString(deletedPrice)))
            .toHaveClass('line-through', 'text-raincloud')
    })

    test('should not strike through the date and amount of a price', async () => {
        renderPrice(price)

        await expect.element(screen.getByText('9/4/2026')).not.toHaveClass('line-through')
        await expect.element(screen.getByText(getPriceString(price))).not.toHaveClass('line-through')
    })
})
