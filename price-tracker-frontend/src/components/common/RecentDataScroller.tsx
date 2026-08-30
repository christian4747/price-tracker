import { Group, Scroller } from "@mantine/core"

export const RecentDataScroller = ({ children, ...props }: Scroller.Props) => {
    return (
        <Scroller {...props} >
            <Group p={1} gap="xs" wrap="nowrap">
                {children}
            </Group>
        </Scroller>
    )
}