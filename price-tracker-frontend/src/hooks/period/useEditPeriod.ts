import { useMutation, useQueryClient } from '@tanstack/react-query'
import periodService from '@/services/periodService'
import { sendSuccessNotification } from '@/utils/notificationUtils'
import type { PeriodDTO, PeriodType } from '@/types/period'

export function useEditPeriod(period: PeriodType) {
    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for editing a period, which takes its new details when it's run
    const editPeriodMutation = useMutation({
        mutationFn: (periodToEdit: PeriodDTO) => {
            return periodService.editPeriod(period.periodId, periodToEdit)
        },
        onSuccess: (editedPeriod: PeriodType) => {
            // Only the period lists change, so prices and products don't need to load again
            queryClient.invalidateQueries({ queryKey: ['periods'] })
            sendSuccessNotification(`Successfully edited period ${editedPeriod.name}`)
        },
        onError: (error) => {
            console.log(`Error occurred while editing ${period.name} (${error.message})`)
        }
    })

    const useEditPeriodProps = {
        mutation: editPeriodMutation
    }

    return useEditPeriodProps
}
