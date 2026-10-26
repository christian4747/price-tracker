import { test as testBase } from 'vitest'
import { worker } from '../mocks/browser'

export const test = testBase.extend<{ worker: typeof worker; resetHandlers: void }>({
    worker: [
        // Vitest requires fixtures to destructure their first argument, even when unused
        // oxlint-disable-next-line no-empty-pattern
        async ({}, use) => {
            // Start the worker once per test worker.
            await worker.start()

            // Expose the worker object on the test's context.
            await use(worker)
        },
        {
            scope: 'worker',
            auto: true
        }
    ],
    resetHandlers: [
        async ({ worker }, use) => {
            await use()

            // Remove any request handlers added in individual test cases.
            // This runs after every test so they can't affect unrelated tests.
            worker.resetHandlers()
        },
        {
            auto: true
        }
    ]
})
