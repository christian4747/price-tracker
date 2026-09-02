/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { playwright } from '@vitest/browser-playwright'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, './src'),
            "components": path.resolve(import.meta.dirname, './src/components'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './vitest.setup.mjs',
        browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [
                { browser: 'chromium' }
            ],
        }
    },
})