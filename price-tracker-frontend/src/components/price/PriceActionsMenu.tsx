import { ActionIcon, Menu, Tooltip } from '@mantine/core'
import { MdDelete, MdDeleteForever, MdEdit, MdMoreHoriz, MdUndo } from 'react-icons/md'
import { useRestorePrice } from '@/hooks/price/useRestorePrice'
import type { PriceType } from '@/types/price'

interface PriceActionsMenu {
    price: PriceType
    openEditPriceModal: (price: PriceType) => void
    openDeletePriceModal: (price: PriceType) => void
    openPermanentlyDeletePriceModal: (price: PriceType) => void
    // A deleted product's prices can't be edited or restored until the product is restored, which restores them too
    productDeleted: boolean
    // Classes for the button that opens the menu, such as when it shows
    className?: string
}

/**
 * A price's actions in one menu, like a product's, so the row needs only one button and leaves the date room to fit.
 * A live price offers Edit and Delete, and a deleted one Edit, Restore, and Permanently delete. A deleted product's
 * prices leave out Edit and Restore.
 */
export const PriceActionsMenu = ({
    price,
    openEditPriceModal,
    openDeletePriceModal,
    openPermanentlyDeletePriceModal,
    productDeleted,
    className
}: PriceActionsMenu) => {
    const { mutation: restoreMutation } = useRestorePrice(price)
    const deleted = price.deletedAt !== null

    return (
        <Menu position="bottom-end" withArrow>
            {/* The tooltip goes outside Menu.Target, so the menu's aria-haspopup and aria-expanded land on the button
                itself, telling screen readers it opens a menu and whether the menu is open */}
            <Tooltip withArrow label="Price actions">
                <Menu.Target>
                    <ActionIcon
                        variant="subtle"
                        color="var(--color-raisin)"
                        aria-label="Price actions"
                        className={className}
                    >
                        <MdMoreHoriz size={20} />
                    </ActionIcon>
                </Menu.Target>
            </Tooltip>

            <Menu.Dropdown>
                {/* Edit is set apart from the deleting actions, as in a product's menu */}
                {!productDeleted && (
                    <>
                        <Menu.Item leftSection={<MdEdit />} onClick={() => openEditPriceModal(price)}>
                            Edit
                        </Menu.Item>
                        <Menu.Divider />
                    </>
                )}

                {!deleted && (
                    <Menu.Item color="red" leftSection={<MdDelete />} onClick={() => openDeletePriceModal(price)}>
                        Delete
                    </Menu.Item>
                )}
                {/* Disabled while restoring, so the price can't be restored twice */}
                {deleted && !productDeleted && (
                    <Menu.Item
                        leftSection={<MdUndo />}
                        disabled={restoreMutation.isPending}
                        onClick={() => restoreMutation.mutate()}
                    >
                        Restore
                    </Menu.Item>
                )}
                {deleted && (
                    <Menu.Item
                        color="red"
                        leftSection={<MdDeleteForever />}
                        onClick={() => openPermanentlyDeletePriceModal(price)}
                    >
                        Permanently delete
                    </Menu.Item>
                )}
            </Menu.Dropdown>
        </Menu>
    )
}
