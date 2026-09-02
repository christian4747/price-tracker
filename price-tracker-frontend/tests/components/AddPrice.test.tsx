import { describe, expect, test } from 'vitest'
import { renderWithClient, screen } from '../../test-utils'
import { AddPriceModal } from '../../src/components/home/modals/AddPriceModal'
import { ProductType } from '../../src/utils/Types'
import { userEvent } from '@testing-library/user-event'

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

        const openAddPrice = screen.getByRole('button')
        await userEvent.click(openAddPrice)

        const discountAmountInput = screen.getByText('Price', { selector: 'label' })
        await expect.element(discountAmountInput).toBeInTheDocument()
    })
})