import { Menu } from '@mantine/core'
import { SortMenu } from './SortMenu'

interface GroupByNameMenu {
    sortValue: string
    setSort: (val: string, isAscending: boolean) => void
    isAscending: boolean
}

export const GroupByNameMenu = ({ sortValue, setSort, isAscending }: GroupByNameMenu) => {
    return (
        <SortMenu sortValue={sortValue} setSort={setSort} isAscending={isAscending}>
            <Menu.RadioItem value="name">Name</Menu.RadioItem>
        </SortMenu>
    )
}
