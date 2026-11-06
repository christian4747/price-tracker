import { ActionIcon, Menu, Tooltip } from '@mantine/core'
import { useClipboard } from '@mantine/hooks'
import { useContext } from 'react'
import { FaCheck, FaCopy, FaLink } from 'react-icons/fa6'
import { MdDelete, MdDeleteForever, MdEdit, MdMoreHoriz, MdUndo } from 'react-icons/md'
import { useRestoreProduct } from '@/hooks/product/useRestoreProduct'
import type { ProductType } from '@/types/product'
import { DeleteProductContext, EditProductContext, PermanentlyDeleteProductContext } from './ProductContext'

interface ProductActionsMenu {
    product: ProductType
    // Classes for the button that opens the menu, such as when it shows
    className?: string
}

// A product's actions in one menu, so the row needs only one button beside the accordion's own
export const ProductActionsMenu = ({ product, className }: ProductActionsMenu) => {
    const openEditProductModal = useContext(EditProductContext)
    const openDeleteProductModal = useContext(DeleteProductContext)
    const openPermanentlyDeleteProductModal = useContext(PermanentlyDeleteProductContext)
    const { mutation: restoreMutation } = useRestoreProduct(product)
    const clipboard = useClipboard({ timeout: 1000 })
    const deleted = product.deletedAt !== null

    return (
        <Menu position="bottom-end" withArrow>
            {/* The tooltip goes outside Menu.Target, so the menu's aria-haspopup and aria-expanded land on the button
                itself, telling screen readers it opens a menu and whether the menu is open */}
            <Tooltip withArrow label="Product actions">
                <Menu.Target>
                    <ActionIcon
                        variant="subtle"
                        color="var(--color-raisin)"
                        aria-label="Product actions"
                        className={className}
                    >
                        <MdMoreHoriz size={20} />
                    </ActionIcon>
                </Menu.Target>
            </Tooltip>

            <Menu.Dropdown>
                <Menu.Item leftSection={<MdEdit />} onClick={() => openEditProductModal(product)}>
                    Edit
                </Menu.Item>
                {/* Stays open and says "Copied" for a moment, so it's clear the copy worked. Both labels share one
                    grid cell and only one is visible, so the item is always as wide as the longer one and the menu
                    doesn't shrink when the label changes. The hidden one is invisible, so screen readers skip it */}
                <Menu.Item
                    leftSection={clipboard.copied ? <FaCheck /> : <FaCopy />}
                    closeMenuOnClick={false}
                    onClick={() => clipboard.copy(product.name)}
                >
                    <span className="grid">
                        <span className={`[grid-area:1/1] ${clipboard.copied ? 'invisible' : ''}`}>Copy name</span>
                        <span className={`[grid-area:1/1] ${clipboard.copied ? '' : 'invisible'}`}>Copied</span>
                    </span>
                </Menu.Item>
                {product.link && (
                    <Menu.Item
                        leftSection={<FaLink />}
                        component="a"
                        href={product.link}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Open link
                    </Menu.Item>
                )}

                <Menu.Divider />

                {!deleted && (
                    <Menu.Item color="red" leftSection={<MdDelete />} onClick={() => openDeleteProductModal(product)}>
                        Delete
                    </Menu.Item>
                )}
                {/* Disabled while restoring, so the product can't be restored twice */}
                {deleted && (
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
                        onClick={() => openPermanentlyDeleteProductModal(product)}
                    >
                        Permanently delete
                    </Menu.Item>
                )}
            </Menu.Dropdown>
        </Menu>
    )
}
