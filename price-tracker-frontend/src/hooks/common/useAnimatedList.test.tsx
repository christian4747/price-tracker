import { StrictMode, useState } from 'react'
import { afterEach, describe, expect, vi } from 'vitest'
import { render, screen, test, userEvent } from '@/test-utils'
import { useAnimatedList } from './useAnimatedList'

const List = () => {
    const [items, setItems] = useState(['First'])
    const listRef = useAnimatedList<HTMLUListElement>()

    return (
        <>
            <button onClick={() => setItems([...items, 'Second'])}>Add</button>
            <button onClick={() => setItems(items.slice(0, 1))}>Remove</button>
            <ul ref={listRef}>
                {items.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>
        </>
    )
}

// Records the animations started on each list item, by the item's text
const recordAnimations = () => {
    const started: { item: string; fadesIn: boolean; fadesOut: boolean }[] = []
    const animate = Element.prototype.animate
    vi.spyOn(Element.prototype, 'animate').mockImplementation(function (this: Element, keyframes, options) {
        if (this.tagName === 'LI') {
            const frames = keyframes as Keyframe[]
            started.push({
                item: this.textContent ?? '',
                fadesIn: frames[0]?.opacity === 0,
                fadesOut: frames.at(-1)?.opacity === 0
            })
        }
        return animate.call(this, keyframes, options)
    })
    return started
}

// Rendered in StrictMode like the app, since that's where a list could end up animated twice
const renderList = () =>
    render(
        <StrictMode>
            <List />
        </StrictMode>
    )

describe('useAnimatedList', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    test('should fade in an added item without replacing the fade', async () => {
        const user = userEvent.setup()
        renderList()
        const started = recordAnimations()

        await user.click(screen.getByRole('button', { name: 'Add' }))

        // The fade in is the only animation on the new item, so nothing cancels it
        expect(started.filter((animation) => animation.item === 'Second')).toEqual([
            { item: 'Second', fadesIn: true, fadesOut: false }
        ])
    })

    test('should fade out a removed item', async () => {
        const user = userEvent.setup()
        renderList()
        await user.click(screen.getByRole('button', { name: 'Add' }))
        const started = recordAnimations()

        await user.click(screen.getByRole('button', { name: 'Remove' }))

        expect(started.filter((animation) => animation.item === 'Second')).toEqual([
            { item: 'Second', fadesIn: false, fadesOut: true }
        ])
    })
})
