import { Button, Menu, Switch } from '@mantine/core'
import type React from 'react'

interface SortMenu {
    sortValue: string
    setSort: (val: string, isAscending: boolean) => void
    isAscending: boolean
    children?: React.ReactNode
}

export const SortMenu = ({ sortValue, setSort, isAscending, children }: SortMenu) => {
    return (
        <>
            <Menu>
                <Menu.Target>
                    <Button className="flex gap-2 min-w-30">Sort</Button>
                </Menu.Target>

                <Menu.Dropdown>
                    <Menu.Label>Sort Value</Menu.Label>
                    <Menu.RadioGroup value={sortValue} onChange={(val) => setSort(val, isAscending)}>
                        {children}
                    </Menu.RadioGroup>
                    <Switch
                        className="p-2"
                        label="Ascending"
                        checked={isAscending}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setSort(sortValue, e.target.checked)
                        }}
                    />
                </Menu.Dropdown>
            </Menu>
        </>
    )
}
