import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import './App.css'
import Home from './pages/HomePage'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/charts/styles.css'
import '@mantine/notifications/styles.css'
import { theme } from './theme'

function App() {
    return (
        <MantineProvider theme={theme}>
            <Notifications />
            <Home/>
        </MantineProvider>
    )
}

export default App