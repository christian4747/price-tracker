import type { PriceDTO, PriceRangeDTO, PriceType, RecentPriceData } from '@/types/price'
import { apiClient } from '@/services/apiClient'

const apiPath = '/prices'

export default {
    addPrice: async (priceToAdd: PriceDTO) => {
        const res = await apiClient.post<PriceType>(apiPath, priceToAdd)
        return res.data
    },

    addPriceRange: async (rangeToAdd: PriceRangeDTO) => {
        const res = await apiClient.post<PriceType[]>(apiPath + '/range', rangeToAdd)
        return res.data
    },

    editPrice: async (priceId: number, priceToAdd: PriceDTO) => {
        const res = await apiClient.put<PriceType>(apiPath + '/' + priceId.toString(), priceToAdd)
        return res.data
    },

    deletePrice: async (priceId: number) => {
        const res = await apiClient.delete<PriceType>(apiPath + '/' + priceId.toString())
        return res.data
    },

    permanentlyDeletePrice: async (priceId: number) => {
        const res = await apiClient.delete<PriceType>(apiPath + '/' + priceId.toString() + '/permanent')
        return res.data
    },

    restorePrice: async (priceId: number) => {
        const res = await apiClient.put<PriceType>(apiPath + '/' + priceId.toString() + '/restore')
        return res.data
    },

    getPrices: async (
        productId: number,
        pageNumber: number = 0,
        pageSize: number = 20,
        showDeleted: boolean = false
    ) => {
        const res = await apiClient.get<PriceType[]>(apiPath + '/product/' + productId, {
            params: {
                page: pageNumber,
                size: pageSize,
                showDeleted: showDeleted
            }
        })
        return res.data
    },

    getPriceCount: async (productId: number) => {
        const res = await apiClient.get<number>(apiPath + '/product/' + productId + '/count')
        return res.data
    },

    getRecentPriceData: async (productId: number, pageNumber: number = 0, pageSize: number = 5) => {
        const res = await apiClient.get<RecentPriceData>(apiPath + '/recent/' + productId, {
            params: {
                page: pageNumber,
                size: pageSize
            }
        })
        return res.data
    }
}
