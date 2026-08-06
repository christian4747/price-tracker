import { MantineProvider } from '@mantine/core'
import './App.css'
import Home from './pages/HomePage'
import '@mantine/core/styles.css'

function App() {
    return (
        <MantineProvider>
            <Home/>
        </MantineProvider>
    )
}

export default App