import { apiClient } from '@/services/apiClient'
import type { PeriodDTO } from '@/types/period'

const apiPath = '/periods'

export default {
    // Gets the store's periods along with the ones for every store, or every period when no store is given. Current and
    // upcoming periods come first, then past ones
    getPeriods: async (store?: string, showDeleted = false) => {
        const res = await apiClient.get(apiPath, {
            params: {
                store: store,
                showDeleted: showDeleted
            }
        })
        return res.data
    },

    addPeriod: async (periodToAdd: PeriodDTO) => {
        const res = await apiClient.post(apiPath, periodToAdd)
        return res.data
    }
}
