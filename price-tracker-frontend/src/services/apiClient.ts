import axios from 'axios'

const rootUrl = import.meta.env.VITE_BACKEND_ROOT_URL

export const apiClient = axios.create({
    baseURL: rootUrl,
    // Modals can't be closed during a save, so a request that never ends can't be left waiting forever
    timeout: 10000,
    paramsSerializer: {
        serialize: (params) => {
            // Filter params that are empty strings
            const nonEmptyParams = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== ''))

            return new URLSearchParams(nonEmptyParams).toString()
        }
    }
})
