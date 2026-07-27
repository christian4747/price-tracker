import axios from "axios"
import type { PriceDTO } from "../utils/Types"

const apiPath = "/prices"

export default {

    addPrice: async (rootUrl: string, priceToAdd: PriceDTO) => {
        const res = await axios.post(rootUrl + apiPath, priceToAdd)
        return res.data
    },

    editPrice: async (rootUrl: string, priceId: number, priceToAdd: PriceDTO) => {
        const res = await axios.put(rootUrl + apiPath + '/' + priceId.toString(), priceToAdd)
        return res.data
    },

    deletePrice: async (rootUrl: string, priceId: number) => {
        const res = await axios.delete(rootUrl + apiPath + '/' + priceId.toString())
        return res.data
    }

}