import { theme } from "@/theme"
import { MantineProvider } from "@mantine/core"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"

export function renderWithClient(ui: React.ReactElement) {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                // ✅ turns retries off
                retry: false,
            },
        },
    })

    return render(
        <MantineProvider theme={theme} env="test"><QueryClientProvider client={queryClient}>{ui}</QueryClientProvider></MantineProvider>
    )
}