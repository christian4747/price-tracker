import axios from "axios"
import type { ProductDTO } from "../utils/Types"

const apiPath = "/products"

export default {

    getAllProducts: async (rootUrl: string) => {
        const res = await axios.get(rootUrl + apiPath)
        return res.data
    },

    getProductCount: async (rootUrl: string) => {
        const res = await axios.get(`${rootUrl}${apiPath}/count`)
        return res.data
    },

    getProductPage: async (rootUrl: string, pageNumber: number = 0, pageSize: number = 10) => {
        const res = await axios.get(`${rootUrl}${apiPath}?page=${pageNumber}&size=${pageSize}`)
        return res.data
    },

    getProductsGrouped: async (rootUrl: string, pageNumber: number, pageSize: number, groupBy: string = 'name') => {
        const res = await axios.get(`${rootUrl}${apiPath}/grouped?page=${pageNumber}&size=${pageSize}&groupBy=${groupBy}`)
        return res.data
    },

    addProduct: async (rootUrl: string, productToAdd: ProductDTO) => {
        const res = await axios.post(rootUrl + apiPath, productToAdd)
        return res.data
    },

    editProduct: async (rootUrl: string, productId: number, productToAdd: ProductDTO) => {
        const res = await axios.put(rootUrl + apiPath + '/' + productId.toString(), productToAdd)
        return res.data
    },

    deleteProduct: async (rootUrl: string, productId: number) => {
        const res = await axios.delete(rootUrl + apiPath + '/' + productId.toString())
        return res.data
    }

}