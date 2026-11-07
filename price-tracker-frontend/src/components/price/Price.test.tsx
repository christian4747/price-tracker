import type { ComponentProps } from 'react'
import { describe, expect, vi } from 'vitest'
import { createPrice, renderWithClient, screen, test, userEvent, waitFor } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import type { PriceType } from '@/types/price'
import { Price } from './Price'
import { getPriceString } from '@/utils/priceUtils'

const pricesApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/prices'

const price = createPrice(1, { priceStarted: new Date(2026, 8, 4, 12).toISOString() })
const deletedPrice = createPrice(1, {
    priceStarted: new Date(2026, 8, 4, 12).toISOString(),
    deletedAt: new Date(2026, 8, 6, 12).toISOString()
})

// Renders the price of a product that isn't deleted, with modal handlers that do nothing, unless a test passes its own
const renderPrice = (priceToRender: PriceType, handlers: Partial<ComponentProps<typeof Price>> = {}) => {
    return renderWithClient(
        <Price
            price={priceToRender}
            openEditPriceModal={() => {}}
            openDeletePriceModal={() => {}}
            openPermanentlyDeletePriceModal={() => {}}
            productDeleted={false}
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

        const deletePriceButton = screen.getByRole('button', { name: /delete price/i })
        await expect.element(deletePriceButton).toBeInTheDocument()
    })

    test('should not render delete price button', async () => {
        renderPrice(deletedPrice)

        const deletePriceButton = screen.queryByRole('button', { name: 'Delete price' })
        await expect.element(deletePriceButton).not.toBeInTheDocument()
    })

    test('should not render restore price button', async () => {
        renderPrice(price)

        const restorePriceButton = screen.queryByRole('button', { name: /restore price/i })
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

        await user.click(screen.getByRole('button', { name: /restore price/i }))

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

        const restoreButton = screen.getByRole('button', { name: /restore price/i })
        await user.click(restoreButton)

        await waitFor(() => expect(restoreButton.querySelector('.mantine-Loader-root')).toBeInTheDocument())
        await user.click(restoreButton)

        finishRestore()

        await waitFor(() => expect(restoreButton.querySelector('.mantine-Loader-root')).not.toBeInTheDocument())
        expect(requestCount).toBe(1)
    })

    // Restoring the product restores its prices, so a deleted product's price can't be restored on its own
    test("should not render restore price button for a deleted product's price", async () => {
        renderPrice(deletedPrice, { productDeleted: true })

        expect(screen.queryByRole('button', { name: 'Restore price' })).not.toBeInTheDocument()
    })

    test("should not render edit price button for a deleted product's price", async () => {
        renderPrice(deletedPrice, { productDeleted: true })

        expect(screen.queryByRole('button', { name: 'Edit price' })).not.toBeInTheDocument()
    })

    test("should open the permanently delete modal for a deleted product's price", async () => {
        const openPermanentlyDeletePriceModal = vi.fn()
        const user = userEvent.setup()
        renderPrice(deletedPrice, { productDeleted: true, openPermanentlyDeletePriceModal })

        await user.click(screen.getByRole('button', { name: 'Permanently delete price' }))

        expect(openPermanentlyDeletePriceModal).toHaveBeenCalledWith(deletedPrice)
    })

    test('should not render permanently delete price button for a price that is not deleted', async () => {
        renderPrice(price)

        expect(screen.queryByRole('button', { name: 'Permanently delete price' })).not.toBeInTheDocument()
    })

    test('should open the permanently delete modal for a deleted price', async () => {
        const openPermanentlyDeletePriceModal = vi.fn()
        const user = userEvent.setup()
        renderPrice(deletedPrice, { openPermanentlyDeletePriceModal })

        await user.click(screen.getByRole('button', { name: 'Permanently delete price' }))

        expect(openPermanentlyDeletePriceModal).toHaveBeenCalledWith(deletedPrice)
    })

    // The order Tab moves through a row's actions, so each one can be reached without a mouse
    test.for([
        ['a price', price, ['Edit price', 'Delete price']],
        ['a deleted price', deletedPrice, ['Edit price', 'Restore price', 'Permanently delete price']]
    ] as const)('should reach each action of %s with Tab', async ([, priceToRender, actions]) => {
        const user = userEvent.setup()
        renderPrice(priceToRender)

        const reached: (string | null)[] = []
        for (let i = 0; i < actions.length; i++) {
            await user.tab()
            reached.push(document.activeElement?.getAttribute('aria-label') ?? null)
        }

        expect(reached).toEqual(actions)
    })

    test('should open the edit modal with Enter', async () => {
        const openEditPriceModal = vi.fn()
        const user = userEvent.setup()
        renderPrice(price, { openEditPriceModal })

        screen.getByRole('button', { name: 'Edit price' }).focus()
        await user.keyboard('{Enter}')

        expect(openEditPriceModal).toHaveBeenCalledWith(price)
    })

    test('should open the delete modal with Space', async () => {
        const openDeletePriceModal = vi.fn()
        const user = userEvent.setup()
        renderPrice(price, { openDeletePriceModal })

        screen.getByRole('button', { name: 'Delete price' }).focus()
        await user.keyboard(' ')

        expect(openDeletePriceModal).toHaveBeenCalledWith(price)
    })

    test('should name an action in its tooltip', async () => {
        const user = userEvent.setup()
        renderPrice(price)

        await user.hover(screen.getByRole('button', { name: 'Edit price' }))

        await expect.element(screen.getByRole('tooltip')).toHaveTextContent('Edit price')
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
