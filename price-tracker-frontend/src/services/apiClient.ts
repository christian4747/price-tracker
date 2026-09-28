import axios from 'axios'

const rootUrl = import.meta.env.VITE_BACKEND_ROOT_URL

export const apiClient = axios.create({
    baseURL: rootUrl,
    paramsSerializer: {
        serialize: (params) => {
            // Filter params that are empty strings
            const nonEmptyParams = Object.fromEntries(
                Object.entries(params).filter(([_, value]) => value !== '')
            )

            return new URLSearchParams(nonEmptyParams).toString()
        }
    }
})