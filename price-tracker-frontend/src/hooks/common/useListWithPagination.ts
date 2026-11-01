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
    // Opened Accordion state (allows control over open accordion items over a component's lifecycle)
    const [currentlyOpened, setCurrentlyOpened] = useState<string[]>([])

    /**
     * Changes the current page of the list.
     * @param pageNumber The page number of the list to change to
     */
    const changePageNumber = (pageNumber: number) => {
        setCurrentPageNumber(pageNumber)
        setCurrentlyOpened([])
    }

    const useListWithPaginationProps = {
        changePageNumber: changePageNumber,
        currentlyOpened: currentlyOpened,
        currentPageNumber: currentPageNumber,
        currentPageSize: currentPageSize,
        setCurrentlyOpened: setCurrentlyOpened,
        setCurrentPageNumber: setCurrentPageNumber
    }

    return useListWithPaginationProps
}
