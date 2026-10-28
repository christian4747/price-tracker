import { theme } from '@/styles/theme'
import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { useState } from 'react'

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false
            }
        }
    })

export const RenderClientWrapper = ({
    children,
    queryClient
}: {
    children: React.ReactNode
    queryClient?: QueryClient
}) => {
    // Created once per test render, so re-renders within a test keep the same cache
    const [client] = useState(() => queryClient ?? createTestQueryClient())

    return (
        <MantineProvider theme={theme} env="test">
            <QueryClientProvider client={client}>{children}</QueryClientProvider>
        </MantineProvider>
    )
}

// Also returns the query client, so tests can check query state
export function renderWithClient(ui: React.ReactElement) {
    const queryClient = createTestQueryClient()
    const renderResult = render(<>{ui}</>, {
        wrapper: ({ children }) => <RenderClientWrapper queryClient={queryClient}>{children}</RenderClientWrapper>
    })

    return { ...renderResult, queryClient }
}
