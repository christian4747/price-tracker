/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, './src'),
        },
    },
    test: {
        globals: true,
        setupFiles: './vitest.setup.mjs',
        browser: {
            enabled: true,
            // Every test runs in Tokyo time, on any machine, so tests of local dates catch code that reads the UTC date
            provider: playwright({ contextOptions: { timezoneId: 'Asia/Tokyo' } }),
            headless: true,
            instances: [
                { browser: 'chromium' }
            ],
        }
    },
})