import type { ProductDTO, ProductFilterDTO } from "../utils/Types"
import { apiClient } from "./apiClient"

const apiPath = "/products"

export default {

    getAllProducts: async (rootUrl: string) => {
        const res = await apiClient.get(rootUrl + apiPath)
        return res.data
    },

    getProductCount: async (rootUrl: string) => {
        const res = await apiClient.get(rootUrl + apiPath + '/count')
        return res.data
    },

    getProductPage: async (rootUrl: string, pageNumber: number = 0, pageSize: number = 10, productFilterDTO: ProductFilterDTO) => {
        const params = { ...productFilterDTO, page: pageNumber, size: pageSize, sort: productFilterDTO?.sort !== undefined ? productFilterDTO?.sort?.toLowerCase() : '' }

        const res = await apiClient.get(rootUrl + apiPath, {
            params: params
        })
        return res.data
    },

    getProductsGrouped: async (rootUrl: string, pageNumber: number, pageSize: number, groupBy: string = 'name', productFilterDTO: ProductFilterDTO) => {
        const params = { ...productFilterDTO, page: pageNumber, size: pageSize, groupBy: groupBy, sort: productFilterDTO?.sort !== undefined ? productFilterDTO?.sort?.toLowerCase() : '' }

        const res = await apiClient.get(rootUrl + apiPath + '/grouped', {
            params: params
        })
        return res.data
    },

    addProduct: async (rootUrl: string, productToAdd: ProductDTO) => {
        const res = await apiClient.post(rootUrl + apiPath, productToAdd)
        return res.data
    },

    editProduct: async (rootUrl: string, productId: number, productToAdd: ProductDTO) => {
        const res = await apiClient.put(rootUrl + apiPath + '/' + productId.toString(), productToAdd)
        return res.data
    },

    deleteProduct: async (rootUrl: string, productId: number) => {
        const res = await apiClient.delete(rootUrl + apiPath + '/' + productId.toString())
        return res.data
    }

}