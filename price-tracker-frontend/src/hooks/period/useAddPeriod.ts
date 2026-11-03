import { useMutation, useQueryClient } from '@tanstack/react-query'
import periodService from '@/services/periodService'
import { sendSuccessNotification } from '@/utils/notificationUtils'
import type { PeriodDTO, PeriodType } from '@/types/period'

export function useAddPeriod() {
    // Get the query client
    const queryClient = useQueryClient()

    // Mutation for adding new periods, which takes the period's details when it's run
    const addPeriodMutation = useMutation({
        mutationFn: (periodToAdd: PeriodDTO) => {
            return periodService.addPeriod(periodToAdd)
        },
        onSuccess: (newPeriod: PeriodType) => {
            // Only the period lists change, so prices and products don't need to load again
            queryClient.invalidateQueries({ queryKey: ['periods'] })
            const typeText = newPeriod.type === 'RETURN' ? 'return' : 'sale'
            sendSuccessNotification(`Successfully added ${typeText} period ${newPeriod.name}`)
        },
        onError: (error, periodToAdd) => {
            console.log(`Error occurred while adding ${periodToAdd.name} (${error.message})`)
        }
    })

    const useAddPeriodProps = {
        mutation: addPeriodMutation
    }

    return useAddPeriodProps
}
