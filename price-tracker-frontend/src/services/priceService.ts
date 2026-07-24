import axios from "axios"
import type { PriceDTO } from "../utils/Types"

const apiPath = "/prices"

export default {

    addPrice: async (rootUrl: string, priceToAdd: PriceDTO) => {
        return await axios.post(rootUrl + apiPath, priceToAdd)
    },

    editPrice: async (rootUrl: string, priceId: number, priceToAdd: PriceDTO) => {
        return await axios.put(rootUrl + apiPath + '/' + priceId.toString(), priceToAdd)
    },

    deletePrice: async (rootUrl: string, priceId: number) => {
        return await axios.delete(rootUrl + apiPath + '/' + priceId.toString())
    }

}