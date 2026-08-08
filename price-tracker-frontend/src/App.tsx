import { Button, createTheme, MantineProvider, Modal } from '@mantine/core'
import './App.css'
import Home from './pages/HomePage'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'

const theme = createTheme({
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
                yOffset: '20vh'
            },
        }),
    },
});

function App() {
    return (
        <MantineProvider theme={theme}>
            <Home/>
        </MantineProvider>
    )
}

export default App