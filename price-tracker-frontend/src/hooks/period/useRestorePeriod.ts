import { useMutation, useQueryClient } from '@tanstack/react-query'
import periodService from '@/services/periodService'
import { sendSuccessNotification } from '@/utils/notificationUtils'
import type { PeriodType } from '@/types/period'

export function useRestorePeriod(period: PeriodType) {
    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for restoring a soft deleted period
    const restorePeriodMutation = useMutation({
        mutationFn: () => {
            return periodService.restorePeriod(period.periodId)
        },
        onSuccess: (restoredPeriod: PeriodType) => {
            queryClient.invalidateQueries({ queryKey: ['periods'] })
            sendSuccessNotification(`Successfully restored period ${restoredPeriod.name}`)
        },
        onError: (error) => {
            console.log(`Error occurred while restoring ${period.name} (${error.message})`)
        }
    })

    const useRestorePeriodProps = {
        mutation: restorePeriodMutation
    }

    return useRestorePeriodProps
}
