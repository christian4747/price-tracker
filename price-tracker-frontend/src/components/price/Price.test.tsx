import type { ComponentProps } from 'react'
import { describe, expect, vi } from 'vitest'
import { userEvent as pointer } from 'vitest/browser'
import { createPrice, renderWithClient, screen, test, userEvent, waitFor } from '@/test-utils'
import { http, HttpResponse } from 'msw'
import type { PriceType } from '@/types/price'
import { Price } from './Price'
import { getPriceString } from '@/utils/priceUtils'
// The actions button fades in and out with Tailwind classes, so the visibility tests need the app's styles
import '@/styles/index.css'

const pricesApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/prices'

const price = createPrice(1, { priceStarted: new Date(2026, 8, 4, 12).toISOString() })
// The current price's tint and bar, Mantine's blue.0 and blue.6, as the browser reports them
const CURRENT_TINT = 'rgb(231, 245, 255)'
const CURRENT_BAR = 'rgb(34, 139, 230)'

const deletedPrice = createPrice(1, {
    priceStarted: new Date(2026, 8, 4, 12).toISOString(),
    deletedAt: new Date(2026, 8, 6, 12).toISOString()
})

/**
 * Render a price row inside a list, since the row is a list item, for a product that isn't deleted.
 * @param priceToRender The price the row shows
 * @param handlers Props to override, such as a modal handler a test wants to watch; the others do nothing
 * @returns The render result
 */
const renderPrice = (priceToRender: PriceType, handlers: Partial<ComponentProps<typeof Price>> = {}) => {
    return renderWithClient(
        <ul>
            <Price
                price={priceToRender}
                openEditPriceModal={() => {}}
                openDeletePriceModal={() => {}}
                openPermanentlyDeletePriceModal={() => {}}
                productDeleted={false}
                {...handlers}
            />
        </ul>
    )
}

describe('Price Component', () => {
    test('should render price', async () => {
        renderPrice(price)

        const price1Date = await screen.findByText('Sep 4, 2026')
        await expect.element(price1Date).toBeInTheDocument()
    })

    test('should strike through and gray out the date and amount of a deleted price', async () => {
        renderPrice(deletedPrice)

        await expect.element(screen.getByText('Sep 4, 2026')).toHaveClass('line-through', 'text-raincloud')
        await expect
            .element(screen.getByText(getPriceString(deletedPrice)))
            .toHaveClass('line-through', 'text-raincloud')
    })

    test('should not strike through the date and amount of a price', async () => {
        renderPrice(price)

        await expect.element(screen.getByText('Sep 4, 2026')).not.toHaveClass('line-through')
        await expect.element(screen.getByText(getPriceString(price))).not.toHaveClass('line-through')
    })

    // Checked by the colors the browser draws, so a mistyped class or color name fails too
    test('should tint the current price, with a bar down its left edge', async () => {
        renderPrice(price, { current: true })

        const row = screen.getByRole('listitem')
        await expect.element(row).toHaveStyle({ backgroundColor: CURRENT_TINT })
        expect(getComputedStyle(row).boxShadow).toContain(`${CURRENT_BAR} 3px 0px 0px 0px inset`)
    })

    test('should not tint a price that is not current', async () => {
        renderPrice(price)

        const row = screen.getByRole('listitem')
        await expect.element(row).toHaveStyle({ backgroundColor: 'rgba(0, 0, 0, 0)' })
        expect(getComputedStyle(row).boxShadow).not.toContain('inset')
    })

    // The tint has no words, so screen readers are told which row is current another way
    test('should mark the current price as current for screen readers', async () => {
        renderPrice(price, { current: true })

        await expect.element(screen.getByRole('listitem')).toHaveAttribute('aria-current', 'true')
    })

    test('should not mark a price that is not current as current', async () => {
        renderPrice(price)

        await expect.element(screen.getByRole('listitem')).not.toHaveAttribute('aria-current')
    })
})

/**
 * Open the row's actions menu with a click, and wait for it to show.
 * @param user The user-event instance the test clicks with
 * @returns The names of the menu's items, from the top
 */
const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: 'Price actions' }))
    await screen.findByRole('menu')
    return screen.getAllByRole('menuitem').map((item) => item.innerText)
}

describe('Price actions menu', () => {
    // One button, rather than one for each action, so the row has room for the date
    test('should show one actions button for a price', async () => {
        renderPrice(deletedPrice)

        expect(screen.getAllByRole('button')).toEqual([screen.getByRole('button', { name: 'Price actions' })])
    })

    test.for([
        ['a price', price, false, ['Edit', 'Delete']],
        ['a deleted price', deletedPrice, false, ['Edit', 'Restore', 'Permanently delete']],
        // Restoring the product restores its prices, so a deleted product's prices can't be edited or restored alone
        ["a deleted product's price", price, true, ['Delete']],
        ["a deleted product's deleted price", deletedPrice, true, ['Permanently delete']]
    ] as const)('should offer the actions for %s', async ([, priceToRender, productDeleted, items]) => {
        const user = userEvent.setup()
        renderPrice(priceToRender, { productDeleted })

        expect(await openMenu(user)).toEqual(items)
    })

    test.for([
        ['edit modal for a price', 'Edit', 'openEditPriceModal', price, false],
        ['delete modal for a price', 'Delete', 'openDeletePriceModal', price, false],
        [
            'permanently delete modal for a deleted price',
            'Permanently delete',
            'openPermanentlyDeletePriceModal',
            deletedPrice,
            false
        ],
        [
            "permanently delete modal for a deleted product's price",
            'Permanently delete',
            'openPermanentlyDeletePriceModal',
            deletedPrice,
            true
        ]
    ] as const)('should open the %s', async ([, item, handler, priceToRender, productDeleted]) => {
        const open = vi.fn()
        const user = userEvent.setup()
        renderPrice(priceToRender, { productDeleted, [handler]: open })

        await openMenu(user)
        await user.click(screen.getByRole('menuitem', { name: item }))

        expect(open).toHaveBeenCalledWith(priceToRender)
    })

    test('should restore a deleted price', async ({ worker }) => {
        // Records each restore request's price ID, so the test can check exactly one went out, for this price
        const restoredPriceIds: string[] = []
        worker.use(
            http.put(pricesApiUrl + '/:priceId/restore', ({ params }) => {
                restoredPriceIds.push(params.priceId as string)
                return HttpResponse.json({ ...deletedPrice, deletedAt: null })
            })
        )
        const user = userEvent.setup()
        renderPrice(deletedPrice)

        await openMenu(user)
        await user.click(screen.getByRole('menuitem', { name: 'Restore' }))

        await waitFor(() => expect(restoredPriceIds).toEqual(['1']))
    })

    // A second click while the first restore is still on its way would send a second request
    test('should not offer Restore again while a restore is still running', async ({ worker }) => {
        // Holds the restore's response until the test lets it go, so the restore stays running while the menu is checked
        let finishRestore = () => {}
        const restoreFinished = new Promise<void>((resolve) => (finishRestore = resolve))
        worker.use(
            http.put(pricesApiUrl + '/:priceId/restore', async () => {
                await restoreFinished
                return HttpResponse.json({ ...deletedPrice, deletedAt: null })
            })
        )
        const user = userEvent.setup()
        renderPrice(deletedPrice)

        await openMenu(user)
        await user.click(screen.getByRole('menuitem', { name: 'Restore' }))
        await openMenu(user)

        await expect.element(screen.getByRole('menuitem', { name: 'Restore' })).toBeDisabled()
        // Lets the held request finish, so it doesn't outlive the test
        finishRestore()
    })

    // The menu has to work without a mouse
    test('should open with Enter and choose an item with the arrow keys', async () => {
        const openDeletePriceModal = vi.fn()
        const user = userEvent.setup()
        renderPrice(price, { openDeletePriceModal })

        screen.getByRole('button', { name: 'Price actions' }).focus()
        await user.keyboard('{Enter}')
        await screen.findByRole('menu')
        // Moves down until Delete is focused, so the test doesn't depend on which item is focused first
        for (let i = 0; i < 5 && document.activeElement?.textContent !== 'Delete'; i++) {
            await user.keyboard('{ArrowDown}')
        }
        await user.keyboard('{Enter}')

        expect(openDeletePriceModal).toHaveBeenCalledWith(price)
    })

    // Focus going back to the button keeps a keyboard user's place in the list
    test('should close with Escape and go back to the menu button', async () => {
        const user = userEvent.setup()
        renderPrice(price)

        await openMenu(user)
        await user.keyboard('{Escape}')

        await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Price actions' }))
    })

    // The button shows only an icon, so the tooltip is what tells a mouse user what it does
    test('should name the menu button in its tooltip', async () => {
        const user = userEvent.setup()
        renderPrice(price)

        await user.hover(screen.getByRole('button', { name: 'Price actions' }))

        await expect.element(screen.getByRole('tooltip')).toHaveTextContent('Price actions')
    })

    // So screen readers say the button opens a menu, and whether the menu is open
    test('should mark the menu button as opening a menu, and as open while it is', async () => {
        const user = userEvent.setup()
        renderPrice(price)
        const button = screen.getByRole('button', { name: 'Price actions' })

        await expect.element(button).toHaveAttribute('aria-haspopup', 'menu')
        await expect.element(button).toHaveAttribute('aria-expanded', 'false')
        await openMenu(user)

        await expect.element(button).toHaveAttribute('aria-expanded', 'true')
    })
})

// Like a product row's actions button: faint until the row is hovered, so the list looks calm but still shows each
// price has actions
describe('Price actions button visibility', () => {
    /**
     * Start checking the actions button's opacity, retrying until any fade has finished.
     * @returns A poll to finish with the expected opacity, such as actionsOpacity().toBe('1')
     */
    const actionsOpacity = () =>
        expect.poll(() => getComputedStyle(screen.getByRole('button', { name: 'Price actions' })).opacity)

    test('should show the actions button faintly while the row is not hovered', async () => {
        renderPrice(price)

        await actionsOpacity().toBe('0.3')
    })

    // Moves the real mouse, since CSS :hover only follows the real pointer, not the events userEvent sends. The mouse
    // stays put between tests, so it's moved off the row before the row is removed, even if the check fails
    test('should show the actions button fully while the row is hovered', async () => {
        renderPrice(price)
        const date = screen.getByText('Sep 4, 2026')

        await pointer.hover(date)
        try {
            await actionsOpacity().toBe('1')
        } finally {
            await pointer.unhover(date)
        }
    })

    // Tab can reach a faint button, so it has to show fully once it has focus
    test('should show the actions button fully when Tab reaches it', async () => {
        const user = userEvent.setup()
        renderPrice(price)

        await user.tab()

        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Price actions' }))
        await actionsOpacity().toBe('1')
    })

    // Otherwise the button would fade while the pointer is in its own menu
    test('should keep the actions button showing fully while its menu is open', async () => {
        const user = userEvent.setup()
        renderPrice(price)

        await user.click(screen.getByRole('button', { name: 'Price actions' }))
        // Moving into the menu leaves the row, which is drawn apart from it
        await user.hover(await screen.findByRole('menu'))

        await actionsOpacity().toBe('1')
    })
})

/**
 * Make a $100.00 price, starting on Sep 4, 2026 like the other fixtures, with the given changes.
 * @param changes The fields to change, such as a discount or a description
 * @returns The price
 */
const priceWith = (changes: Partial<PriceType>) => createPrice(1, { ...price, ...changes })
// $100.00 with 20% off. discountAmount is the price after the discount, not the amount taken off.
const twentyPercentOff = { discountAmount: 80, discountPercentage: 0.2, totalAmount: 80 }

describe('Price details line', () => {
    test('should not show a details line for a plain full price', async () => {
        renderPrice(price)

        // Only the date and the amount, with no details line under them
        await expect.element(screen.getByRole('listitem')).toHaveTextContent(/^Sep 4, 2026\$100\.00$/)
    })

    // Saved amounts can come back a hair off, such as 99.9999999 for 100, which isn't a real discount
    test('should not show a discount or return made of floating-point leftovers', async () => {
        renderPrice(priceWith({ discountAmount: 99.9999999, returnAmount: 0.0000001, totalAmount: 99.9999998 }))

        // The total rounds to $100.00, with no details line under it
        await expect.element(screen.getByRole('listitem')).toHaveTextContent(/^Sep 4, 2026\$100\.00$/)
    })

    test('should show the base price and the discount', async () => {
        renderPrice(priceWith(twentyPercentOff))

        await expect.element(screen.getByText('$100.00 base · 20% off')).toBeInTheDocument()
    })

    test('should show the base price and the return of a full price with a return', async () => {
        renderPrice(priceWith({ returnAmount: 5, returnPercentage: 0.05, totalAmount: 95 }))

        await expect.element(screen.getByText('$100.00 base · $5.00 back')).toBeInTheDocument()
    })

    test('should show the description without a base price on a full price', async () => {
        renderPrice(priceWith({ description: 'Black Friday' }))

        await expect.element(screen.getByText('Black Friday')).toBeInTheDocument()
    })

    // Otherwise it would leave an empty part at the end of the line
    test('should leave out a description that is only spaces', async () => {
        renderPrice(priceWith({ ...twentyPercentOff, description: '   ' }))

        await expect.element(screen.getByText('$100.00 base · 20% off')).toBeInTheDocument()
    })

    test('should show when a price with an end date ends', async () => {
        renderPrice(priceWith({ priceEnded: new Date(2026, 8, 30, 23, 59).toISOString() }))

        await expect.element(screen.getByText('until Sep 30')).toBeInTheDocument()
    })

    // The date alone would repeat the row's own date
    test('should show the end time of a price that ends on the day it starts', async () => {
        renderPrice(priceWith({ priceEnded: new Date(2026, 8, 4, 23, 59).toISOString() }))

        await expect.element(screen.getByText('until 11:59 PM')).toBeInTheDocument()
    })

    test('should show the year of an end date in a later year than the start', async () => {
        renderPrice(priceWith({ priceEnded: new Date(2027, 0, 2, 12).toISOString() }))

        await expect.element(screen.getByText('until Jan 2, 2027')).toBeInTheDocument()
    })

    test('should show every part in order', async () => {
        renderPrice(
            priceWith({
                ...twentyPercentOff,
                // 5% back of the $80.00 paid after the discount is $4.00, for a total of $76.00
                returnAmount: 4,
                returnPercentage: 0.05,
                totalAmount: 76,
                description: 'Black Friday',
                priceEnded: new Date(2026, 8, 30, 23, 59).toISOString()
            })
        )

        await expect
            .element(screen.getByText('$100.00 base · 20% off · $4.00 back · Black Friday · until Sep 30'))
            .toBeInTheDocument()
    })

    test("should show amounts in the price's currency", async () => {
        renderPrice(priceWith({ currency: 'EUR', returnAmount: 4, returnPercentage: 0.04, totalAmount: 96 }))

        await expect.element(screen.getByText('€100.00 base · €4.00 back')).toBeInTheDocument()
    })

    // A blank currency counts as USD, as it does everywhere else in the app
    test('should show amounts in USD when the price has no currency', async () => {
        renderPrice(priceWith({ ...twentyPercentOff, currency: '' }))

        await expect.element(screen.getByText('$100.00 base · 20% off')).toBeInTheDocument()
    })

    // Matches how the rest of the app shows a discount below 1%, which would otherwise round to 0%
    test('should keep the decimals of a discount below 1%', async () => {
        renderPrice(priceWith({ discountAmount: 99.5, discountPercentage: 0.005, totalAmount: 99.5 }))

        await expect.element(screen.getByText('$100.00 base · 0.5% off')).toBeInTheDocument()
    })

    test('should wrap a long details line onto at most two lines and show all of it on hover', async () => {
        const text = '$100.00 base · 20% off · A very long description that will not fit in the narrow price column'
        // The description is the third part of the expected line
        renderPrice(priceWith({ ...twentyPercentOff, description: text.split(' · ')[2] }))

        // The wrapping itself is measured in ProductDetails' layout tests, where the row has its real width
        const details = screen.getByText(text)
        await expect.element(details).toHaveClass('line-clamp-2')
        await expect.element(details).not.toHaveClass('truncate')
        await expect.element(details).toHaveAttribute('title', text)
    })

    test('should not strike through the details of a deleted price', async () => {
        renderPrice(priceWith({ ...twentyPercentOff, deletedAt: deletedPrice.deletedAt }))

        // A strike-through on any block around the line would draw through it too
        expect(screen.getByText('$100.00 base · 20% off').closest('.line-through')).toBeNull()
    })
})
