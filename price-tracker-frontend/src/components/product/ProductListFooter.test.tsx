import { describe, expect, test, vi } from 'vitest'
import { renderWithClient, screen, userEvent } from '@/test-utils'
import { ProductListFooter } from './ProductListFooter'
// The footer's layout and pointer events come from these styles
import '@mantine/core/styles.css'
import '@/styles/index.css'

describe('Product List Footer Component', () => {
    test('should let clicks beside the pagination buttons reach the element behind it', () => {
        renderWithClient(
            <>
                <button className="fixed inset-0">Behind</button>
                <ProductListFooter total={20} />
            </>
        )

        const { left, top, height } = screen.getByRole('contentinfo').getBoundingClientRect()

        expect(document.elementFromPoint(left + 1, top + height / 2)).toBe(
            screen.getByRole('button', { name: 'Behind' })
        )
    })

    test('should change the page when a pagination button is clicked', async () => {
        const onChange = vi.fn()
        const user = userEvent.setup()
        renderWithClient(<ProductListFooter total={20} value={1} onChange={onChange} />)

        await user.click(screen.getByRole('button', { name: '2' }))

        expect(onChange).toHaveBeenCalledWith(2)
    })
})
