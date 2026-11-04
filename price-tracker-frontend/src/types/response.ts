// A page of results, with the number of results across all pages
export interface ResponseAndCount<T> {
    content: T[]
    count: number
}
