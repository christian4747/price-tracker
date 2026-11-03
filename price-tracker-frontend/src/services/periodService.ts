import { apiClient } from '@/services/apiClient'

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
    }
}
