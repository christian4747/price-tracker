import { Group, Scroller } from "@mantine/core"

export const RecentDataScroller = ({ children, ...props }: Scroller.Props) => {
    return (
        <Scroller {...props} >
            <Group gap="xs" wrap="nowrap">
                {children}
            </Group>
        </Scroller>
    )
}