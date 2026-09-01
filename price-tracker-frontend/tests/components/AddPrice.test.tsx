import { describe, expect, it, test } from 'vitest'
import { renderWithClient, screen } from '../../test-utils'
import { AddPriceModal } from '../../src/components/home/modals/AddPriceModal'
import { ProductType } from '../../src/utils/Types'
import { userEvent } from 'vitest/browser'

const product: ProductType = {
    active: false,
    productId: 0,
    name: '',
    link: '',
    store: '',
    createdAt: '',
    updatedAt: '',
    prices: []
}

describe('Add Price Component', () => {
    test('should render input for price', async () => {
        renderWithClient(<AddPriceModal product={product} setDateToday={() => { }} />)

        const user = userEvent.setup()

        const openAddPrice = screen.getByRole('button')

        await user.click(openAddPrice)

        const discountAmountInput = screen.getByText('Price', { selector: 'label' })
        await expect.element(discountAmountInput).toBeInTheDocument()
    })
})