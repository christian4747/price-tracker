import { Button, createTheme, Modal, TextInput } from '@mantine/core'

export const theme = createTheme({
    fontFamily: 'Inter, sans-serif',
    components: {
        Button: Button.extend({
            defaultProps: {
                radius: 'xl',
                color: 'var(--color-raisin)'
            }
        }),
        Modal: Modal.extend({
            styles: {
                // Keeps room for the scrollbar even before it appears, so the content doesn't narrow and shift when
                // it does. The room is kept on both sides, so the margins stay even. Mantine's ScrollArea would avoid
                // the room altogether, but it stretches the modal to fit wide rows
                content: {
                    scrollbarGutter: 'stable both-edges'
                },
                title: {
                    fontSize: '1.875rem',
                    lineHeight: 2.25 / 1.875,
                    fontWeight: 700
                }
            },
            defaultProps: {
                removeScrollProps: { enabled: false },
                yOffset: '10vh'
            }
        }),
        TextInput: TextInput.extend({
            defaultProps: {
                radius: 'xl'
            }
        })
    }
})
