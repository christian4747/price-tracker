import type { PriceDTO, ProductDTO } from "../utils/Types"
import priceService from "./priceService"
import productService from "./productService"

const rootUrl = import.meta.env.VITE_BACKEND_ROOT_URL

export default {

    getRootUrl: () => {
        return rootUrl
    },

    addPrice: async (priceToAdd: PriceDTO) => {
        return priceService.addPrice(rootUrl, priceToAdd)
    },

    editPrice: async (priceId: number, priceToAdd: PriceDTO) => {
        return priceService.editPrice(rootUrl, priceId, priceToAdd)
    },

    deletePrice: async (priceId: number) => {
        return priceService.deletePrice(rootUrl, priceId)
    },

    getAllProducts: async () => {
        return productService.getAllProducts(rootUrl)
    },

    addProduct: async (productToAdd: ProductDTO) => {
        return productService.addProduct(rootUrl, productToAdd)
    },

    editProduct: async (productId: number, productToAdd: ProductDTO) => {
        return productService.editProduct(rootUrl, productId, productToAdd)
    },

    deleteProduct: async (productId: number) => {
        return productService.deleteProduct(rootUrl, productId)
    } 

}