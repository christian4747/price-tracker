import axios from "axios"
import type { ProductDTO } from "../utils/Types"

const apiPath = "/products"

export default {

    getAllProducts: async (rootUrl: string) => {
        const res = await axios.get(rootUrl + apiPath)
        return res.data
    },

    addProduct: async (rootUrl: string, productToAdd: ProductDTO) => {
        const res = await axios.post(rootUrl + apiPath, productToAdd)
        return res.data
    },

    editProduct: async (rootUrl: string, productId: number, productToAdd: ProductDTO) => {
        return await axios.put(rootUrl + apiPath + '/' + productId.toString(), productToAdd)
    },

    deleteProduct: async (rootUrl: string, productId: number) => {
        return await axios.delete(rootUrl + apiPath + '/' + productId.toString())
    }

}