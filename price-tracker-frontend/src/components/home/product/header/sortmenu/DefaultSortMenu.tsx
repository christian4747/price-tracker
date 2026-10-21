import { Menu } from "@mantine/core"
import { SortMenu } from "./SortMenu"

interface DefaultSortMenu {
    sortValue: string
    setSort: (val: string, isAscending: boolean) => void
    isAscending: boolean
}

export const DefaultSortMenu = ({ sortValue, setSort, isAscending }: DefaultSortMenu) => {
    return (
        <SortMenu
            sortValue={sortValue}
            setSort={setSort}
            isAscending={isAscending}
        >
            <Menu.RadioItem value='name'>Name</Menu.RadioItem>
            <Menu.RadioItem value='brand'>Brand</Menu.RadioItem>
            <Menu.RadioItem value='store'>Store</Menu.RadioItem>
            <Menu.RadioItem value='currentPrice'>Current Price</Menu.RadioItem>
            <Menu.RadioItem value='currentDiscount'>Current Discount</Menu.RadioItem>
            <Menu.RadioItem value='createdAt'>Date Added</Menu.RadioItem>
            <Menu.RadioItem value='updatedAt'>Last Updated</Menu.RadioItem>
            <Menu.RadioItem value='timeRemaining'>Time Remaining</Menu.RadioItem>
        </SortMenu>
    )
}