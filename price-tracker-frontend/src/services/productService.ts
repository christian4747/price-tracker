import type { ProductBody, ProductDTO, ProductFilterDTO, ProductNameGroup, ProductType } from '@/types/product'
import type { ResponseAndCount } from '@/types/response'
import { apiClient } from '@/services/apiClient'

const apiPath = '/products'

export default {
    getAllProducts: async () => {
        const res = await apiClient.get<ResponseAndCount<ProductBody>>(apiPath)
        return res.data
    },

    getProductCount: async () => {
        const res = await apiClient.get<number>(apiPath + '/count')
        return res.data
    },

    getProductPage: async (pageNumber: number = 0, pageSize: number = 10, productFilterDTO: ProductFilterDTO) => {
        const params = { ...productFilterDTO, page: pageNumber, size: pageSize }

        const res = await apiClient.get<ResponseAndCount<ProductBody>>(apiPath, {
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

        const res = await apiClient.get<ResponseAndCount<ProductNameGroup>>(apiPath + '/grouped', {
            params: params
        })
        return res.data
    },

    getRecentBrands: async (pageNumber: number = 0, pageSize: number = 5) => {
        const res = await apiClient.get<string[]>(apiPath + '/recent/brands', {
            params: {
                page: pageNumber,
                size: pageSize
            }
        })
        return res.data
    },

    getRecentStores: async (pageNumber: number = 0, pageSize: number = 5) => {
        const res = await apiClient.get<string[]>(apiPath + '/recent/stores', {
            params: {
                page: pageNumber,
                size: pageSize
            }
        })
        return res.data
    },

    addProduct: async (productToAdd: ProductDTO) => {
        const res = await apiClient.post<ProductType>(apiPath, productToAdd)
        return res.data
    },

    editProduct: async (productId: number, productToAdd: ProductDTO) => {
        const res = await apiClient.put<ProductType>(apiPath + '/' + productId.toString(), productToAdd)
        return res.data
    },

    deleteProduct: async (productId: number) => {
        const res = await apiClient.delete<ProductType>(apiPath + '/' + productId.toString())
        return res.data
    },

    permanentlyDeleteProduct: async (productId: number) => {
        const res = await apiClient.delete<ProductType>(apiPath + '/' + productId.toString() + '/permanent')
        return res.data
    },

    restoreProduct: async (productId: number) => {
        const res = await apiClient.put<ProductType>(apiPath + '/' + productId.toString() + '/restore')
        return res.data
    }
}
