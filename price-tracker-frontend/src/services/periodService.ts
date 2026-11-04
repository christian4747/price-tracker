import { apiClient } from '@/services/apiClient'
import type { MatchingPeriodPricesPage, PeriodDTO } from '@/types/period'

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

    // Gets a page of the prices that fall within the period, each with its product, newest start first, along with the
    // number that match across all pages
    getPeriodPrices: async (
        periodId: number,
        pageNumber: number = 0,
        pageSize: number = 20
    ): Promise<MatchingPeriodPricesPage> => {
        const res = await apiClient.get(apiPath + '/' + periodId.toString() + '/prices', {
            params: {
                page: pageNumber,
                size: pageSize
            }
        })
        return res.data
    },

    addPeriod: async (periodToAdd: PeriodDTO) => {
        const res = await apiClient.post(apiPath, periodToAdd)
        return res.data
    },

    editPeriod: async (periodId: number, periodToEdit: PeriodDTO) => {
        const res = await apiClient.put(apiPath + '/' + periodId.toString(), periodToEdit)
        return res.data
    },

    // Soft deletes the period, so it can be restored from the deleted list
    deletePeriod: async (periodId: number) => {
        const res = await apiClient.delete(apiPath + '/' + periodId.toString())
        return res.data
    },

    restorePeriod: async (periodId: number) => {
        const res = await apiClient.put(apiPath + '/' + periodId.toString() + '/restore')
        return res.data
    },

    // Only works on a deleted period, and can't be undone
    permanentlyDeletePeriod: async (periodId: number) => {
        const res = await apiClient.delete(apiPath + '/' + periodId.toString() + '/permanent')
        return res.data
    }
}
