import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import Home from './pages/HomePage'
import { theme } from './styles/theme'

function App() {
    return (
        <MantineProvider theme={theme}>
            <Notifications />
            <Home />
        </MantineProvider>
    )
}

export default App
