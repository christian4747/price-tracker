import type { PriceDTO } from "@/utils/Types"
import { apiClient } from "@/services/apiClient"

const apiPath = "/prices"

export default {

    addPrice: async (priceToAdd: PriceDTO) => {
        const res = await apiClient.post(apiPath, priceToAdd)
        return res.data
    },

    editPrice: async (priceId: number, priceToAdd: PriceDTO) => {
        const res = await apiClient.put(apiPath + '/' + priceId.toString(), priceToAdd)
        return res.data
    },

    deletePrice: async (priceId: number) => {
        const res = await apiClient.delete(apiPath + '/' + priceId.toString())
        return res.data
    },

    getPrices: async (productId: number, pageNumber: number = 0, pageSize: number = 20, showDeleted: boolean = false) => {
        const res = await apiClient.get(apiPath + '/product/' + productId, {
            params: {
                page: pageNumber,
                size: pageSize,
                showDeleted: showDeleted,
            }
        })
        return res.data
    },

    getRecentPriceData: async (productId: number, pageNumber: number = 0, pageSize: number = 5) => {
        const res = await apiClient.get(apiPath + '/recent/' + productId, {
            params: {
                page: pageNumber,
                size: pageSize,
            }
        })
        return res.data
    },

}
