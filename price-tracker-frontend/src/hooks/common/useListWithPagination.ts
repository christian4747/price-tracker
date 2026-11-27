import { useState } from 'react'

export function useListWithPagination<Filter>(pageNumber: number = 1, pageSize: number = 10, filter: Filter) {
    // Current page state
    const [currentPageNumber, setCurrentPageNumber] = useState(pageNumber)
    // The filter the current page belongs to
    const [pageFilter, setPageFilter] = useState(filter)

    // A new filter has its own pages, so start from the first. Done while rendering so the old page is never requested
    if (filter !== pageFilter) {
        setPageFilter(filter)
        setCurrentPageNumber(1)
    }

    // Current page size state
    const [currentPageSize] = useState(pageSize)

    /**
     * Changes the current page of the list.
     * @param pageNumber The page number of the list to change to
     */
    const changePageNumber = (pageNumber: number) => {
        setCurrentPageNumber(pageNumber)
    }

    const useListWithPaginationProps = {
        changePageNumber: changePageNumber,
        currentPageNumber: currentPageNumber,
        currentPageSize: currentPageSize,
        setCurrentPageNumber: setCurrentPageNumber
    }

    return useListWithPaginationProps
}
