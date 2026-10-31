import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { sendErrorNotification } from './notificationUtils'
import { getErrorMessage } from './errorUtils'

// Creates the app's query client, which shows a notification for every failed query and mutation
const createQueryClient = () => {
    return new QueryClient({
        queryCache: new QueryCache({
            onError: (error) => {
                sendErrorNotification(getErrorMessage(error))
            }
        }),
        mutationCache: new MutationCache({
            onError: (error) => {
                sendErrorNotification(getErrorMessage(error))
            }
        })
    })
}

export { createQueryClient }
