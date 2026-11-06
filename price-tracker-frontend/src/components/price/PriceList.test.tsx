import { describe, expect } from 'vitest'
import {
    createPrice,
    createProduct,
    createProductBody,
    renderWithClient,
    screen,
    test,
    userEvent,
    waitFor
} from '@/test-utils'
import { http, HttpResponse } from 'msw'
import { PriceList } from './PriceList'
import { useState } from 'react'

const pricesApiUrl = import.meta.env.VITE_BACKEND_ROOT_URL + '/prices'

// Like the API's prices, these have no product ID
const price1 = createPrice(1, { priceStarted: new Date(2026, 8, 4, 12).toISOString() })
const price2 = createPrice(2, { priceStarted: new Date(2026, 8, 5, 12).toISOString() })

const product = createProduct(1)

const averages = { averagePrice: 15, weightedAveragePrice: 17.5 }

const emptyRecentPriceData = {
    baseAmounts: [],
    currencies: [],
    descriptions: [],
    discountPercentages: [],
    pricesStarted: [],
    pricesEnded: [],
    returnPercentages: [],
    pricePeriods: []
}

// Opens the edit modal for the first price of a product with ID 7, so a default ID can't match by accident
const openEditForProduct7 = async () => {
    const user = userEvent.setup()
    renderPriceList(createProductBody(createProduct(7)))
    await user.click(screen.getAllByRole('button', { name: 'Edit price' })[0])
    return user
}

const renderPriceList = (productBody = createProductBody(product)) => {
    function PriceListWithState() {
        const [checked, setChecked] = useState(false)

        return (
            <PriceList
                productBody={productBody}
                prices={[price1, price2]}
                setDateToday={() => {}}
                showDeleted={checked}
                setShowDeleted={setChecked}
            />
        )
    }

    return renderWithClient(<PriceListWithState />)
}

describe('Price List Component', () => {
    test('should render product prices', async () => {
        renderPriceList()

        const price1Date = screen.getByText('9/4/2026')
        await expect.element(price1Date).toBeInTheDocument()

        const price2Date = screen.getByText('9/5/2026')
        await expect.element(price2Date).toBeInTheDocument()
    })

    test('should render add price button', async () => {
        renderPriceList()

        const price1Date = screen.getByText(/add price/i)
        await expect.element(price1Date).toBeInTheDocument()
    })

    test('should render show deleted prices checkbox', async () => {
        renderPriceList()

        const checkbox = screen.getByRole('checkbox', { name: /show deleted/i })
        await expect.element(checkbox).toBeInTheDocument()

        const price1Date = screen.getByText('9/4/2026')
        await expect.element(price1Date).toBeInTheDocument()

        const price2Date = screen.getByText('9/5/2026')
        await expect.element(price2Date).toBeInTheDocument()
    })

    test('should render checked checkbox', async () => {
        const user = userEvent.setup()

        renderPriceList()

        const checkbox = screen.getByRole('checkbox', { name: /show deleted/i })
        await expect.element(checkbox).toBeInTheDocument()
        await expect.element(checkbox).not.toBeChecked()
        await user.click(checkbox)
        await expect.element(checkbox).toBeChecked()
    })

    test('should show the average price', async () => {
        renderPriceList(createProductBody(product, averages))

        await expect.element(screen.getByText('Average price: $15.00')).toBeInTheDocument()
    })

    test("should format the average price with the product's currency", async () => {
        renderPriceList(createProductBody(product, { ...averages, priceToday: createPrice(1, { currency: 'EUR' }) }))

        await expect.element(screen.getByText('Average price: €15.00')).toBeInTheDocument()
    })

    test("should format the average price as USD when the product's prices have no currency", async () => {
        renderPriceList(createProductBody(product, { ...averages, priceToday: createPrice(1, { currency: '' }) }))

        await expect.element(screen.getByText('Average price: $15.00')).toBeInTheDocument()
    })

    test('should show the weighted average price when hovering the average price', async () => {
        const user = userEvent.setup()
        renderPriceList(createProductBody(product, averages))

        await user.hover(screen.getByText('Average price: $15.00'))

        await expect
            .element(await screen.findByText('Weighted by how long each price lasted: $17.50'))
            .toBeInTheDocument()
    })

    test('should not show the average price when the product has no average', async () => {
        renderPriceList(createProductBody(product, { averagePrice: null, weightedAveragePrice: null }))

        expect(screen.queryByText(/average price/i)).not.toBeInTheDocument()
    })

    test("should ask for the product's recent prices when editing a price", async ({ worker }) => {
        let requestedProductId: string | undefined
        worker.use(
            http.get(pricesApiUrl + '/recent/:productId', ({ params }) => {
                requestedProductId = params.productId as string
                return HttpResponse.json(emptyRecentPriceData)
            })
        )
        await openEditForProduct7()

        await waitFor(() => expect(requestedProductId).toBe('7'))
    })

    test("should save an edited price with the product's ID", async ({ worker }) => {
        let savedBody: { productId?: number } | undefined
        worker.use(
            http.put(pricesApiUrl + '/:priceId', async ({ request }) => {
                savedBody = (await request.json()) as { productId?: number }
                return HttpResponse.json(price1)
            })
        )
        const user = await openEditForProduct7()

        await user.click(await screen.findByRole('button', { name: 'Edit Price' }))

        await waitFor(() => expect(savedBody).toBeDefined())
        expect(savedBody?.productId).toBe(7)
    })
})
