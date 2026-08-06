import { createTheme, MantineProvider } from '@mantine/core'
import './App.css'
import Home from './pages/HomePage'
import '@mantine/core/styles.css'

const theme = createTheme({
    fontFamily: 'Inter, sans-serif'
});

function App() {
    return (
        <MantineProvider theme={theme}>
            <Home/>
        </MantineProvider>
    )
}

export default App