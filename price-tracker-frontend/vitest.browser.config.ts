import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, './src'),
            "components": path.resolve(import.meta.dirname, './src/components'),
        },
    },
    test: {
        globals: true,
        setupFiles: './vitest.setup.mjs',
        browser: {
            enabled: true,
            provider: playwright(),
            instances: [
                { browser: 'chromium' }
            ],
        },
    },
})
