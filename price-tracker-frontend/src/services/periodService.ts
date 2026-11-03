import { apiClient } from '@/services/apiClient'
import type { PeriodDTO } from '@/types/period'

const apiPath = '/periods'

export default {
    // Gets the store's periods along with the ones for every store, current and upcoming first, then past
    getPeriods: async (store: string) => {
        const res = await apiClient.get(apiPath, {
            params: {
                store: store
            }
        })
        return res.data
    },

    addPeriod: async (periodToAdd: PeriodDTO) => {
        const res = await apiClient.post(apiPath, periodToAdd)
        return res.data
    }
}
