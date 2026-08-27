import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { sendErrorNotification } from './utils/NotificationUtilities.ts'

const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: (error) => {
            sendErrorNotification(`An error has occurred: ${error}`)
        }
    }),
    mutationCache: new MutationCache({
        onError: (error) => {
            sendErrorNotification(`An error has occurred: ${error}`)
        }
    })
})

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <App />
            <ReactQueryDevtools initialIsOpen={true} />
        </QueryClientProvider>
    </StrictMode>,
)
