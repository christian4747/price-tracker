import { useState } from "react"

export function useListWithPagination(pageNumber: number = 1, pageSize: number = 10) {

    // Current page state
    const [currentPageNumber, setCurrentPageNumber] = useState(pageNumber)
    // Current page size state
    const [currentPageSize, ] = useState(pageSize)
    // Opened Accordion state (allows control over open accordion items over a component's lifecycle)
    const [currentlyOpened, setCurrentlyOpened] = useState<string[]>([])

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
        setCurrentPageNumber: setCurrentPageNumber,
    }

    return useListWithPaginationProps
}