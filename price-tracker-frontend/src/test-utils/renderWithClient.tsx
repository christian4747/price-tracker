import { theme } from "@/theme"
import { MantineProvider } from "@mantine/core"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"

export const RenderClientWrapper = ({ children }: { children: React.ReactNode}) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    })

    return (
        <MantineProvider theme={theme} env="test">
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </MantineProvider>
    )
}

export function renderWithClient(ui: React.ReactElement) {
    return render(<>{ui}</>, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
            <RenderClientWrapper children={children} />)
        },
    )
}