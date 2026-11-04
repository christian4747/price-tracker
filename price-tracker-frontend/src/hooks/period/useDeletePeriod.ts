import { useMutation, useQueryClient } from '@tanstack/react-query'
import periodService from '@/services/periodService'
import { sendSuccessNotification } from '@/utils/notificationUtils'
import type { PeriodType } from '@/types/period'

export function useDeletePeriod(period: PeriodType) {
    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for soft deleting a period
    const deletePeriodMutation = useMutation({
        mutationFn: () => {
            return periodService.deletePeriod(period.periodId)
        },
        onSuccess: (deletedPeriod: PeriodType) => {
            queryClient.invalidateQueries({ queryKey: ['periods'] })
            sendSuccessNotification(`Successfully deleted period ${deletedPeriod.name}`)
        },
        onError: (error) => {
            console.log(`Error occurred while deleting ${period.name} (${error.message})`)
        }
    })

    const useDeletePeriodProps = {
        mutation: deletePeriodMutation
    }

    return useDeletePeriodProps
}
