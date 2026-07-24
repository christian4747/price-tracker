import axios from "axios"
import type { ProductDTO } from "../utils/Types"

const apiPath = "/products"

export default {

    getAllProducts: async (rootUrl: string) => {
        return await axios.get(rootUrl + apiPath)
    },

    addProduct: async (rootUrl: string, productToAdd: ProductDTO) => {
        return await axios.post(rootUrl + apiPath, productToAdd)
    },

    editProduct: async (rootUrl: string, productId: number, productToAdd: ProductDTO) => {
        return await axios.put(rootUrl + apiPath + '/' + productId.toString(), productToAdd)
    },

    deleteProduct: async (rootUrl: string, productId: number) => {
        return await axios.delete(rootUrl + apiPath + '/' + productId.toString())
    }

}