import { useMutation, useQueryClient } from '@tanstack/react-query'
import periodService from '@/services/periodService'
import { sendSuccessNotification } from '@/utils/notificationUtils'
import type { PeriodType } from '@/types/period'

export function usePermanentlyDeletePeriod(period: PeriodType) {
    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for permanently deleting a period that's already soft deleted
    const permanentlyDeletePeriodMutation = useMutation({
        mutationFn: () => {
            return periodService.permanentlyDeletePeriod(period.periodId)
        },
        onSuccess: (removedPeriod: PeriodType) => {
            queryClient.invalidateQueries({ queryKey: ['periods'] })
            sendSuccessNotification(`Successfully permanently deleted period ${removedPeriod.name}`)
        },
        onError: (error) => {
            console.log(`Error occurred while permanently deleting ${period.name} (${error.message})`)
        }
    })

    const usePermanentlyDeletePeriodProps = {
        mutation: permanentlyDeletePeriodMutation
    }

    return usePermanentlyDeletePeriodProps
}
