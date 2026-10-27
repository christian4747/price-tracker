import type { ProductDTO, ProductFilterDTO } from '@/types/product'
import { apiClient } from '@/services/apiClient'

const apiPath = '/products'

export default {
    getAllProducts: async () => {
        const res = await apiClient.get(apiPath)
        return res.data
    },

    getProductCount: async () => {
        const res = await apiClient.get(apiPath + '/count')
        return res.data
    },

    getProductPage: async (pageNumber: number = 0, pageSize: number = 10, productFilterDTO: ProductFilterDTO) => {
        const params = { ...productFilterDTO, page: pageNumber, size: pageSize }

        const res = await apiClient.get(apiPath, {
            params: params
        })
        return res.data
    },

    getProductsGrouped: async (
        pageNumber: number = 0,
        pageSize: number = 10,
        productFilterDTO: ProductFilterDTO,
        groupBy: string = 'name'
    ) => {
        const params = { ...productFilterDTO, page: pageNumber, size: pageSize, groupBy: groupBy }

        const res = await apiClient.get(apiPath + '/grouped', {
            params: params
        })
        return res.data
    },

    getRecentStores: async (pageNumber: number = 0, pageSize: number = 5) => {
        const res = await apiClient.get(apiPath + '/recent/stores', {
            params: {
                page: pageNumber,
                size: pageSize
            }
        })
        return res.data
    },

    addProduct: async (productToAdd: ProductDTO) => {
        const res = await apiClient.post(apiPath, productToAdd)
        return res.data
    },

    editProduct: async (productId: number, productToAdd: ProductDTO) => {
        const res = await apiClient.put(apiPath + '/' + productId.toString(), productToAdd)
        return res.data
    },

    deleteProduct: async (productId: number) => {
        const res = await apiClient.delete(apiPath + '/' + productId.toString())
        return res.data
    }
}
