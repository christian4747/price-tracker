import { Button, createTheme, Modal, TextInput } from "@mantine/core";

export const theme = createTheme({
    fontFamily: 'Inter, sans-serif',
    components: {
        Button: Button.extend({
            defaultProps: {
                radius: 'xl',
                color: 'var(--color-raisin)'
            },
        }),
        Modal: Modal.extend({
            styles: {
                title: {
                    fontSize: '1.875rem',
                    lineHeight: 2.25 / 1.875,
                    fontWeight: 700
                },
            },
            defaultProps: {
                removeScrollProps: { enabled: false },
                yOffset: '10vh'
            },
        }),
        TextInput: TextInput.extend({
            defaultProps: {
                radius: 'xl'
            },
        })
    },
});