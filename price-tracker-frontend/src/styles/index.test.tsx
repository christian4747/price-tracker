import { describe, expect, test } from 'vitest'
import { Button, MantineProvider, Text } from '@mantine/core'
import { render, screen } from '@/test-utils'
import { theme } from './theme'
// The app's global styles, including Mantine's
import '@/styles/index.css'

const renderWithTheme = (ui: React.ReactNode) => render(<MantineProvider theme={theme}>{ui}</MantineProvider>)

describe('Global styles', () => {
    test('should let a Tailwind class set the margin of a Mantine component', () => {
        renderWithTheme(<Text className="mt-2">Note</Text>)

        expect(getComputedStyle(screen.getByText('Note')).marginTop).toBe('8px')
    })

    test("should keep Mantine's own styles over Tailwind's reset", () => {
        renderWithTheme(<Button>Save</Button>)

        // Tailwind's reset makes button backgrounds transparent
        expect(getComputedStyle(screen.getByRole('button', { name: 'Save' })).backgroundColor).not.toBe(
            'rgba(0, 0, 0, 0)'
        )
    })

    test("should use Mantine's light color scheme", () => {
        renderWithTheme(<Text>Note</Text>)

        // With "light dark", scrollbars and other native parts turn dark when the system is in dark mode
        expect(getComputedStyle(document.documentElement).colorScheme).toBe('light')
    })
})
